'use strict';

const db = require('../../config/db');
const fs = require('fs'); // Untuk operasi sinkron/callback (Multer)
const fsPromises = require('fs').promises; // Untuk operasi Async (Read File, Write Signature)
const path = require('path');
const crypto = require('crypto');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
const { Gateway, Wallets } = require('fabric-network');

// --- HELPER FUNCTIONS ---

// Fungsi untuk menghitung hash file (SHA-256)
async function calculateFileHash(filePath) {
  try {
    const fileBuffer = await fsPromises.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error calculating file hash:', error);
    throw new Error('Gagal menghitung hash file.');
  }
}

// Fungsi untuk koneksi ke Blockchain sebagai PBF (Org2)
async function getPbfGateway() {
  try {
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Pastikan user pbfAdmin sudah di-enroll
    const identityLabel = 'pbfAdmin'; 
    const identity = await wallet.get(identityLabel);
    if (!identity) {
        throw new Error(`Identitas "${identityLabel}" tidak ditemukan di wallet. Jalankan script enrollAdminPbf.js.`);
    }

    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json');
    const ccp = JSON.parse(await fsPromises.readFile(ccpPath, 'utf8'));

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: identityLabel,
        discovery: { enabled: true, asLocalhost: true }
    });
    return gateway;
  } catch (error) {
    console.error('Error initializing PBF gateway:', error);
    throw new Error(`Gagal koneksi blockchain: ${error.message}`);
  }
}

// Helper CouchDB (Public State)
async function fetchFromCouchDB(idProdusen) {
  try {
    const dbName = process.env.COUCHDB_DB || 'medisyncchannel_medisync';
    const dbInstance = nano.use(dbName);
    // Query Mango CouchDB
    const result = await dbInstance.find({
      selector: {
        docType: 'obat',
        pemilikSaatIni: 'ProdusenMSP', // Cari yang masih punya Produsen
      },
      fields: ['id', 'namaObat', 'bentukSediaan', 'dosis', 'tanggalProduksi', 'tanggalKadaluarsa', 'penanggungJawab', 'jumlah'],
      limit: 50,
    });
    
    // Mapping agar sesuai format Frontend
    return result.docs.map(doc => ({
      id: doc.id,
      batch_id: doc.id,
      nama_obat: doc.namaObat,
      bentuk_sediaan: doc.bentukSediaan,
      dosis: doc.dosis,
      jumlah: doc.jumlah || 0,
      tanggal_produksi: doc.tanggalProduksi,
      tanggal_kadaluarsa: doc.tanggalKadaluarsa,
      penanggung_jawab: doc.penanggungJawab,
      // Harga tidak diambil dari sini karena mungkin Private Data
      harga_per_unit: 0, 
      nama_perusahaan: 'PT Medisync (Blockchain)',
    }));
  } catch (error) {
    console.error('Error CouchDB:', error.message);
    return [];
  }
}

// Helper MySQL Fallback
async function fetchFromMySQL(idProdusen) {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.batch_id, p.nama_obat, p.bentuk_sediaan, p.dosis, p.jumlah, 
             p.tanggal_produksi, p.tanggal_kadaluarsa, p.penanggung_jawab, p.harga_per_unit
      FROM produksi p
      WHERE p.id_produsen = ? AND p.status = 'Tercatat di Blockchain'
      ORDER BY p.tanggal_produksi DESC
    `, [idProdusen]);
    return rows;
  } catch (error) {
    return [];
  }
}

// --- KONFIGURASI MULTER ---
const multer = require('multer');

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, JPEG) yang diizinkan!'), false);
  }
};

// Storage Penerimaan
const penerimaanStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_penerimaan';
    // Gunakan fs biasa (sinkron/callback) untuk Multer
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `penerimaan-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Storage Pengembalian
const pengembalianStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_pengembalian';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `pengembalian-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadPenerimaan = multer({ storage: penerimaanStorage, fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPengembalian = multer({ storage: pengembalianStorage, fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// --- MAIN CONTROLLER ---

const pesananController = {

  // 1. Get All Pesanan PBF
  getAll: async (req, res) => {
    try {
      const sql = `
        SELECT 
          p.id, p.nomor_po, p.tanggal_pesanan, p.status, 
          p.nama_pbf, p.alamat_pbf, 
          COALESCE(p.total_harga, 0) AS total_harga,
          u.nama_resmi AS nama_produsen,
          (SELECT dp.id_aset_blockchain 
           FROM detail_pesanan dp 
           WHERE dp.id_pesanan = p.id AND dp.id_aset_blockchain IS NOT NULL
           LIMIT 1) AS id_aset_blockchain
        FROM pesanan p
        LEFT JOIN users u ON p.id_produsen = u.id
        WHERE p.id_pbf = ?
        ORDER BY p.tanggal_pesanan DESC
      `;
      const [rows] = await db.query(sql, [req.user.id]);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // 2. Get Detail Pesanan
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Ambil Header Pesanan
      const sqlPesanan = `
        SELECT 
          p.*, 
          u.nama_resmi AS nama_produsen,
          u.alamat AS alamat_produsen,
          sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman,
          sjp.catatan_penerima, sjp.catatan_kurir
        FROM pesanan p
        JOIN users u ON p.id_produsen = u.id
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        WHERE p.id = ? AND p.id_pbf = ?
      `;
      const [pesanan] = await db.query(sqlPesanan, [id, req.user.id]);
      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
      }

      // Ambil Detail Item
      const sqlDetail = `
        SELECT dp.*, pr.batch_id
        FROM detail_pesanan dp
        LEFT JOIN produksi pr ON dp.id_produksi = pr.id OR pr.batch_id = dp.id_produksi
        WHERE dp.id_pesanan = ?
      `;
      const [detail] = await db.query(sqlDetail, [id]);

      // Parsing Catatan Khusus untuk Alasan-alasan
      let alasan_pembatalan = '-';
      let alasan_penolakan = '-';
      let alasan_pengembalian = '-';
      let alasan_penolakan_pengembalian = '-';

      if (pesanan[0].catatan_khusus) {
          const catatan = pesanan[0].catatan_khusus;
          const matchBatal = catatan.match(/Alasan:([\s\S]*?)(\[|$)/);
          if (matchBatal) alasan_pembatalan = matchBatal[1].trim();
          
          const matchTolakBatal = catatan.match(/\[PENOLAKAN\]:([\s\S]*?)(\[|$)/);
          if (matchTolakBatal) alasan_penolakan = matchTolakBatal[1].trim();

          const matchKembali = catatan.match(/Pengembalian Diajukan PBF\. Alasan:([\s\S]*?)(\[|$)/);
          if (matchKembali) alasan_pengembalian = matchKembali[1].trim();
          
          const matchTolakKembali = catatan.match(/\[PENOLAKAN PENGEMBALIAN\]:([\s\S]*)/);
          if (matchTolakKembali) alasan_penolakan_pengembalian = matchTolakKembali[1].trim();
      }

      res.json({
        success: true,
        data: {
          pesanan: { 
            ...pesanan[0], 
            alasan_pembatalan, alasan_penolakan,
            alasan_pengembalian, alasan_penolakan_pengembalian 
          },
          detail_pesanan: detail
        }
      });
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // 3. Cek Stok Blockchain (Untuk Form Pemesanan)
  getStokFromBlockchain: async (req, res) => {
    try {
      const { idProdusen } = req.params;
      // Coba ambil dari CouchDB (Public State)
      const onChainData = await fetchFromCouchDB(idProdusen);
      
      if (onChainData.length === 0) {
        // Fallback ke MySQL Produsen (Simulasi Hybrid)
        const offChainData = await fetchFromMySQL(idProdusen);
        return res.json({ success: true, data: offChainData, source: 'off-chain' });
      }

      res.json({ success: true, data: onChainData, source: 'on-chain' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // 4. CREATE PESANAN (CORE FUNCTION)
  create: async (req, res) => {
    const {
      id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
      nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
      tujuan_distribusi, catatan_khusus, items, tanda_tangan_data_url
    } = req.body;
    const id_pbf = req.user.id;

    let dbConnection;
    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();
      
      // Setup CouchDB untuk Validasi Stok Real-time
      const dbCouch = nano.use('medisyncchannel_medisync');

      // Generate Nomor PO (Format: PBF/IV/2025/XXXX)
      const prefix = 'PBF/IV/2025/';
      const [lastOrder] = await dbConnection.query(
        "SELECT nomor_po FROM pesanan WHERE nomor_po LIKE ? ORDER BY id DESC LIMIT 1",
        [`${prefix}%`]
      );
      let nextSeqNumber = 1; 
      if (lastOrder.length > 0) {
        const lastSeqStr = lastOrder[0].nomor_po.substring(prefix.length); 
        nextSeqNumber = parseInt(lastSeqStr, 10) + 1;
      }
      const generated_nomor_po = prefix + String(nextSeqNumber).padStart(4, '0');

      // Validasi Stok per Item
      for (const item of items) {
        const batchId = item.id_produksi; // Ini adalah Batch ID Blockchain
        try {
          // Validasi ke Public State Blockchain (CouchDB)
          const onChainDoc = await dbCouch.get(batchId);
          if (item.jumlah_pesanan > onChainDoc.jumlah) {
            throw new Error(`Stok ${onChainDoc.namaObat} tidak cukup (Tersedia: ${onChainDoc.jumlah}).`);
          }
        } catch (couchError) {
           // Jika tidak ketemu di CouchDB, coba cek MySQL (Fallback)
           const [prodSql] = await dbConnection.query('SELECT jumlah FROM produksi WHERE batch_id = ?', [batchId]);
           if (prodSql.length === 0) {
               throw new Error(`Batch ID ${batchId} tidak ditemukan.`);
           }
           if (item.jumlah_pesanan > prodSql[0].jumlah) {
               throw new Error(`Stok ${batchId} tidak cukup.`);
           }
        }
      }
      
      // Simpan Tanda Tangan
      const base64Data = tanda_tangan_data_url.replace(/^data:image\/png;base64,/, "");
      const fileName = `ttd-pesanan-${Date.now()}.png`;
      const filePath = path.join('uploads', 'tanda_tangan', fileName);
      
      // Pastikan folder ada
      await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
      await fsPromises.writeFile(filePath, base64Data, 'base64');
      
      // Hitung Total Harga
      const total_harga = items.reduce((sum, item) => sum + (Number(item.jumlah_pesanan) * Number(item.harga_per_unit)), 0);

      // Insert Header Pesanan
      const sqlPesanan = `
        INSERT INTO pesanan (
          nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
          nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
          tujuan_distribusi, catatan_khusus, tanda_tangan_apoteker, status, total_harga
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const [resultPesanan] = await dbConnection.query(sqlPesanan, [
        generated_nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
        nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
        tujuan_distribusi || null, catatan_khusus || null, filePath, 'Perlu Dikirim', total_harga
      ]);
      const idPesanan = resultPesanan.insertId;

      // Insert Detail Pesanan & Update Stok Produsen (Reservasi Stok)
      for (const item of items) {
        // Cari ID Integer Produksi untuk Foreign Key
        const [produksiRows] = await dbConnection.query('SELECT id FROM produksi WHERE batch_id = ?', [item.id_produksi]);
        if (produksiRows.length === 0) throw new Error(`Batch ID ${item.id_produksi} tidak valid.`);
        const idProduksiInteger = produksiRows[0].id;

        await dbConnection.query(
          `INSERT INTO detail_pesanan (id_pesanan, id_produksi, nama_obat, bentuk_sediaan, dosis, jumlah_pesanan, harga_per_unit, total_harga) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
          [idPesanan, idProduksiInteger, item.nama_obat, item.bentuk_sediaan, item.dosis, item.jumlah_pesanan, item.harga_per_unit, item.total_harga]
        );
        
        // Kurangi stok di MySQL Produsen (Simulasi Reservasi)
        await dbConnection.query('UPDATE produksi SET jumlah = jumlah - ? WHERE id = ?', [item.jumlah_pesanan, idProduksiInteger]);
      }

      await dbConnection.commit();

      // Notifikasi Realtime
      if (req.io) {
        req.io.emit('block_mined', {
          type: 'PESANAN_BARU',
          hash: '0x' + crypto.randomBytes(32).toString('hex'), 
          timestamp: new Date().toLocaleTimeString(),
          org: 'PBFMSP',
          details: `New PO: ${generated_nomor_po}`
        });
      }

      res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat!', idPesanan, nomorPo: generated_nomor_po });
    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in create:', error);
      res.status(500).json({ success: false, message: `Gagal membuat pesanan: ${error.message}` });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  // 5. Pembatalan & Pengembalian (Logic Standar)
  requestPembatalan: async (req, res) => {
    const { id } = req.params;
    const { alasan } = req.body;
    const idPbf = req.user.id;
    if (!alasan) return res.status(400).json({ success: false, message: 'Alasan wajib diisi.' });

    try {
      const [pesanan] = await db.query(
        "SELECT id FROM pesanan WHERE id = ? AND id_pbf = ? AND status = 'Perlu Dikirim'",
        [id, idPbf]
      );
      if (pesanan.length === 0) return res.status(403).json({ success: false, message: "Pesanan tidak dapat dibatalkan." });
      
      await db.query("UPDATE pesanan SET status = 'Pembatalan Diajukan', catatan_khusus = ? WHERE id = ?", [`Dibatalkan oleh PBF. Alasan: ${alasan}`, id]);
      res.json({ success: true, message: "Pengajuan pembatalan berhasil dikirim." });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  konfirmasiPembatalan: async (req, res) => {
    // ... (Logika Konfirmasi Pembatalan jika PBF yang membatalkan sendiri)
    try {
        const { id } = req.params;
        const idPbf = req.user.id;
        await db.query("UPDATE pesanan SET status = 'Dibatalkan' WHERE id = ? AND id_pbf = ?", [id, idPbf]);
        res.json({ success: true, message: 'Pembatalan dikonfirmasi.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  ajukanPengembalian: async (req, res) => {
    const { id } = req.params;
    const { alasan } = req.body;
    const idPbf = req.user.id;
    
    if (!req.file || !alasan) return res.status(400).json({ success: false, message: 'Foto dan alasan wajib diisi.' });

    const buktiFotoPath = req.file.path.replace(/\\/g, '/');
    const catatan = `Pengembalian Diajukan PBF. Alasan: ${alasan}`;

    try {
        const [result] = await db.query(
           "UPDATE pesanan SET status = 'Pengembalian Diajukan', catatan_khusus = ?, bukti_foto = ? WHERE id = ? AND id_pbf = ?",
          [catatan, buktiFotoPath, id, idPbf]
        );
        if (result.affectedRows === 0) throw new Error('Gagal mengajukan pengembalian.');
        res.json({ success: true, message: 'Pengajuan pengembalian berhasil.' });
    } catch (error) {
        try { await fsPromises.unlink(req.file.path); } catch(e) {}
        res.status(500).json({ success: false, message: error.message });
    }
  },

  // 6. KONFIRMASI PENERIMAAN (Blockchain Transaction)
  // Fungsi ini dipanggil saat PBF menerima barang fisik
  konfirmasiPenerimaan: async (req, res) => {
        const { id } = req.params;
        const idPbf = req.user.id;
        const buktiFotoPath = req.file ? req.file.path : null;
        
        if (!buktiFotoPath) return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
        
        let gateway;
        let dbConnection;

        try {
            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();

            const [pesanan] = await dbConnection.query("SELECT id, nomor_po FROM pesanan WHERE id = ? AND id_pbf = ?", [id, idPbf]);
            if (pesanan.length === 0) throw new Error('Pesanan tidak ditemukan.');

            const hashBuktiFoto = await calculateFileHash(buktiFotoPath);

            // Connect Blockchain
            gateway = await getPbfGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            // Pastikan Chaincode Anda mendukung fungsi ini (PbfContract atau ProdusenContract)
            const contract = network.getContract('medisync');

            // Ambil detail aset yang harus diterima
            const [items] = await dbConnection.query("SELECT id_aset_blockchain FROM detail_pesanan WHERE id_pesanan = ?", [id]);
            
            for (const item of items) {
                if (!item.id_aset_blockchain) continue;

                // Memanggil Smart Contract: terimaBarang
                // Pastikan fungsi 'terimaBarang' ada di Chaincode
                const transaction = contract.createTransaction('PbfContract:terimaBarang'); 
                await transaction.submit(item.id_aset_blockchain, hashBuktiFoto, idPbf.toString());            
            }

            // Socket Emit
            if (req.io) {
                req.io.emit('block_mined', {
                  type: 'PENERIMAAN_PBF',
                  hash: '0x' + crypto.randomBytes(32).toString('hex'),
                  timestamp: new Date().toLocaleTimeString(),
                  org: 'PBFMSP',
                  details: `Received PO: ${pesanan[0].nomor_po}`
                });
            }

            // Update Database
            await dbConnection.query("UPDATE pesanan SET status = 'Selesai', bukti_foto = ? WHERE id = ?", [buktiFotoPath, id]);
            
            await dbConnection.commit();
            res.json({ success: true, message: 'Penerimaan berhasil dikonfirmasi & tercatat di Blockchain.' });
        } catch (error) {
            if (dbConnection) await dbConnection.rollback();
            if (buktiFotoPath) try { await fsPromises.unlink(buktiFotoPath); } catch(e) {}
            res.status(500).json({ success: false, message: `Gagal konfirmasi: ${error.message}` });
        } finally {
            if (gateway) gateway.disconnect();
            if (dbConnection) dbConnection.release();
        }
    },

  // 7. Riwayat / Tracking Asset
  getRiwayatByAssetId: async (req, res) => {
        const { assetId } = req.params;
        const idPbf = req.user.id;
        let gateway;

        try {
            gateway = await getPbfGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');
            
            // Read Blockchain
            const resultBuffer = await contract.evaluateTransaction('readObat', assetId);
            const onChainData = JSON.parse(resultBuffer.toString());

            const isApotekOrder = onChainData.riwayat.some(h => h.status === 'DIKIRIM_KE_APOTEK');
            const assetIdParts = assetId.split('-');
            const idPesanan = assetIdParts[assetIdParts.length - 1];
            
            let offChainRows = [];
            let detailSql = '';

            if (isApotekOrder) {
                // Logic PBF -> Apotek
                const sql = `SELECT pa.*, sjp.*, pbf.nama_resmi as nama_pbf, apotek.nama_resmi as nama_apotek, pa.bukti_foto as buktiPenerimaUrl 
                             FROM pesanan_apotek pa 
                             LEFT JOIN surat_jalan_pbf sjp ON pa.id = sjp.id_pesanan_apotek 
                             LEFT JOIN users pbf ON pa.id_pbf = pbf.id 
                             LEFT JOIN users apotek ON pa.id_apotek = apotek.id 
                             WHERE pa.id = ? AND pa.id_pbf = ?`;
                [offChainRows] = await db.query(sql, [idPesanan, idPbf]);
                detailSql = `SELECT dp.*, dp.id_aset_blockchain AS batch_id FROM detail_pesanan_apotek dp WHERE dp.id_pesanan_apotek = ?`;
            } else {
                // Logic Produsen -> PBF
                const sql = `SELECT p.*, sjp.*, pbf.nama_resmi as nama_pbf, produsen.nama_resmi as nama_produsen, p.bukti_foto as buktiPenerimaUrl 
                             FROM pesanan p 
                             LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan 
                             LEFT JOIN users pbf ON p.id_pbf = pbf.id 
                             LEFT JOIN users produsen ON p.id_produsen = produsen.id 
                             WHERE p.id = ? AND p.id_pbf = ?`;
                [offChainRows] = await db.query(sql, [idPesanan, idPbf]);
                detailSql = `SELECT dp.*, pr.batch_id FROM detail_pesanan dp LEFT JOIN produksi pr ON dp.id_produksi = pr.id WHERE dp.id_pesanan = ?`;
            }
            
            if (offChainRows.length === 0) return res.status(404).json({ success: false, message: 'Data pesanan off-chain tidak ditemukan.' });

            const [detail_pesanan] = await db.query(detailSql, [offChainRows[0].id]);

            res.json({
                success: true,
                data: { onChain: onChainData, offChain: offChainRows[0], detail_pesanan: detail_pesanan }
            });

        } catch (error) {
            console.error(`Error tracking asset ${assetId}:`, error);
            res.status(500).json({ success: false, message: 'Gagal melacak aset.' });
        } finally {
            if (gateway) gateway.disconnect();
        }
    },

    getLacakPengembalianPbf: async (req, res) => {
        // ... (Implementasi standar query MySQL untuk pelacakan pengembalian)
         const { id } = req.params; 
            const idPbf = req.user.id;
        
            try {
              const sql = `
                SELECT 
                  p.id, p.status, p.tanggal_pesanan,
                  p.bukti_foto_pengembalian,
                  sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman,
                  pbf.nama_resmi AS nama_pbf,
                  produsen.nama_resmi AS nama_produsen
                FROM pesanan p
                JOIN users pbf ON p.id_pbf = pbf.id
                JOIN users produsen ON p.id_produsen = produsen.id
                LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
                WHERE p.id = ? AND p.id_pbf = ?
              `;
              const [rows] = await db.query(sql, [id, idPbf]);
        
              if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
              }
        
              res.json({ success: true, data: rows[0] });
            } catch (error) {
              res.status(500).json({ success: false, message: 'Server Error' });
            }
    },
    
    acknowledgeRejection: async (req, res) => {
        const { id } = req.params;
        const idPbf = req.user.id;
        try {
          await db.query("UPDATE pesanan SET status = 'Dibatalkan' WHERE id = ? AND id_pbf = ? AND status = 'Pembatalan Ditolak'", [id, idPbf]);
          res.json({ success: true, message: 'Pesanan dibatalkan.' });
        } catch (error) {
          res.status(500).json({ success: false, message: 'Server Error' });
        }
    },
  
  uploadPenerimaanMiddleware: uploadPenerimaan,
  uploadPengembalianMiddleware: uploadPengembalian
};

module.exports = pesananController;