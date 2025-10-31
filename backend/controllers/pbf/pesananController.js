'use strict';

const db = require('../../config/db');
const fs = require('fs').promises; // Hanya satu deklarasi fs
const path = require('path');
const crypto = require('crypto');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
const { Gateway, Wallets } = require('fabric-network');
const grpc = require('@grpc/grpc-js');



// Fungsi untuk menghitung hash file
async function calculateFileHash(filePath) {
  try {
    console.log(`Calculating hash for file: ${filePath}`);
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    const fileHash = hash.digest('hex');
    console.log(`File hash calculated: ${fileHash}`);
    return fileHash;
  } catch (error) {
    console.error('Error calculating file hash:', error);
    throw new Error('Gagal menghitung hash file.');
  }
}

// Fungsi untuk membuat koneksi ke Hyperledger Fabric
async function getPbfGateway() {
  try {
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('pbfAdmin');
    if (!identity) {
        throw new Error('Identitas "pbfAdmin" tidak ditemukan di dalam wallet. Jalankan enrollAdminPbf.js terlebih dahulu.');
    }

    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json');
    const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'pbfAdmin',
        discovery: { enabled: true, asLocalhost: true }
    });
    return gateway;
  } catch (error) {
    console.error('Error initializing PBF gateway:', error);
    throw new Error(`Gagal menginisialisasi koneksi ke blockchain: ${error.message}`);
  }
}

// --- KONFIGURASI MULTER YANG BENAR ---
const multer = require('multer');

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, JPEG) yang diizinkan!'), false);
  }
};

const penerimaanStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_penerimaan';
    fs.mkdir(dir, { recursive: true }).then(() => cb(null, dir));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `penerimaan-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});
const uploadPenerimaan = multer({ storage: penerimaanStorage, fileFilter: imageFileFilter, limits: { fileSize: 1024 * 1024 * 5 } });

const pengembalianStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_pengembalian';
    fs.mkdir(dir, { recursive: true }).then(() => cb(null, dir));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `pengembalian-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});
const uploadPengembalian = multer({ storage: pengembalianStorage, fileFilter: imageFileFilter, limits: { fileSize: 1024 * 1024 * 5 } });
// --- AKHIR KONFIGURASI MULTER ---

async function fetchFromCouchDB(idProdusen) {
  try {
    const dbName = process.env.COUCHDB_DB || 'medisyncchannel_medisync';
    const dbInstance = nano.use(dbName);
    const result = await dbInstance.find({
      selector: {
        docType: 'obat',
        pemilikSaatIni: 'ProdusenMSP',
      },
      fields: ['id', 'namaObat', 'bentukSediaan', 'dosis', 'tanggalProduksi', 'tanggalKadaluarsa', 'penanggungJawab', 'jumlah', 'hargaPerUnit'],
      limit: 50,
      skip: 0,
    });
    console.log('CouchDB query result:', result.docs.length, 'documents');
    const mappedData = result.docs.map(doc => ({
      id: doc.id,
      batch_id: doc.id,
      nama_obat: doc.namaObat,
      bentuk_sediaan: doc.bentukSediaan,
      dosis: doc.dosis,
      jumlah: doc.jumlah || 0,
      tanggal_produksi: doc.tanggalProduksi,
      tanggal_kadaluarsa: doc.tanggalKadaluarsa,
      penanggung_jawab: doc.penanggungJawab,
      harga_per_unit: doc.hargaPerUnit || 0,
      nama_perusahaan: 'PT Medisync',
    }));
    console.log('Mapped CouchDB data sample:', mappedData[0]);
    return mappedData;
  } catch (error) {
    console.error('Error fetching from CouchDB:', error.message, error.stack);
    return [];
  }
}

async function fetchFromMySQL(idProdusen) {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.batch_id, p.nama_obat, p.bentuk_sediaan, p.dosis, p.jumlah, 
             p.tanggal_produksi, p.tanggal_kadaluarsa, p.penanggung_jawab, p.harga_per_unit
      FROM produksi p
      WHERE p.id_produsen = ? AND p.status = 'Tercatat di Blockchain'
      ORDER BY p.tanggal_produksi DESC
    `, [idProdusen]);
    console.log('MySQL fallback data sample:', rows[0]);
    return rows;
  } catch (error) {
    console.error('Error fetching from MySQL:', error.message, error.stack);
    return [];
  }
}

const pesananController = {
  getAll: async (req, res) => {
    try {
      const sql = `
  SELECT 
    p.id, p.nomor_po, p.tanggal_pesanan, p.status AS status, 
    p.nama_pbf, p.alamat_pbf, COALESCE(p.total_harga, 0) AS total_harga,
    (SELECT dp.id_aset_blockchain 
     FROM detail_pesanan dp 
     WHERE dp.id_pesanan = p.id AND dp.id_aset_blockchain IS NOT NULL
     LIMIT 1) AS id_aset_blockchain
  FROM pesanan p
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

  

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const sqlPesanan = `
        SELECT 
          p.*, 
          u.nama_resmi AS nama_produsen,
          u.alamat AS alamat_produsen,
          sjp.nomor_resi,
          sjp.nomor_surat_jalan,
          sjp.tanggal_pengiriman
        FROM pesanan p
        JOIN users u ON p.id_produsen = u.id
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        WHERE p.id = ? AND p.id_pbf = ?
      `;
      const [pesanan] = await db.query(sqlPesanan, [id, req.user.id]);
      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
      }

      const sqlDetail = `
        SELECT dp.*, pr.batch_id
        FROM detail_pesanan dp
        LEFT JOIN produksi pr ON dp.id_produksi = pr.id OR pr.batch_id = dp.id_produksi
        WHERE dp.id_pesanan = ?
      `;
      const [detail] = await db.query(sqlDetail, [id]);

      const totalFromDetail = detail.reduce((sum, item) => sum + parseFloat(item.total_harga || 0), 0);
      pesanan[0].total_harga = pesanan[0].total_harga || totalFromDetail;

      // --- PERBAIKAN LOGIKA PARSING ---
      let alasan_pembatalan = '-';
      let alasan_penolakan = '-';
      let alasan_pengembalian = '-';
      let alasan_penolakan_pengembalian = '-';

      if (pesanan[0].catatan_khusus) {
          const catatan = pesanan[0].catatan_khusus;

          // 1. Parse Alasan Pembatalan (dari PBF) - "Alasan: ..."
          const pembatalanMatch = catatan.match(/Alasan:([\s\S]*?)(\[PENOLAKAN\]:|$)/);
          if (pembatalanMatch && pembatalanMatch[1]) {
              alasan_pembatalan = pembatalanMatch[1].trim();
          }

          // 2. Parse Alasan Penolakan Pembatalan (dari Produsen) - "[PENOLAKAN]: ..."
          const penolakanPembatalanMatch = catatan.match(/\[PENOLAKAN\]:([\s\S]*?)(\[|$)/);
          if (penolakanPembatalanMatch && penolakanPembatalanMatch[1]) {
              alasan_penolakan = penolakanPembatalanMatch[1].trim();
          }

          // 3. Parse Alasan Pengembalian (dari PBF) - "Pengembalian Diajukan PBF. Alasan: ..."
          const pengembalianMatch = catatan.match(/Pengembalian Diajukan PBF\. Alasan:([\s\S]*?)(\[PENOLAKAN PENGEMBALIAN\]:|$)/);
          if (pengembalianMatch && pengembalianMatch[1]) {
              alasan_pengembalian = pengembalianMatch[1].trim();
          }

          // 4. Parse Alasan Penolakan Pengembalian (dari Produsen) - "[PENOLAKAN PENGEMBALIAN]: ..."
          const penolakanPengembalianMatch = catatan.match(/\[PENOLAKAN PENGEMBALIAN\]:([\s\S]*)/);
          if (penolakanPengembalianMatch && penolakanPengembalianMatch[1]) {
              alasan_penolakan_pengembalian = penolakanPengembalianMatch[1].trim();
          }
      }
      // --- AKHIR PERBAIKAN ---

      res.json({
        success: true,
        data: {
          pesanan: { 
            ...pesanan[0], 
            alasan_pembatalan, 
            alasan_penolakan,
            alasan_pengembalian, // <-- Tambahkan
            alasan_penolakan_pengembalian // <-- Tambahkan
          },
          detail_pesanan: detail
        }
      });
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  getStokFromBlockchain: async (req, res) => {
    try {
      const { idProdusen } = req.params;
      console.log('Fetching stok from CouchDB for idProdusen:', idProdusen);
      const onChainData = await fetchFromCouchDB(idProdusen);
      console.log('On-chain data:', onChainData.length, 'items');
      
      if (onChainData.length === 0) {
        console.log('No on-chain data, falling back to MySQL');
        const offChainData = await fetchFromMySQL(idProdusen);
        return res.json({ success: true, data: offChainData, source: 'off-chain' });
      }

      res.json({ success: true, data: onChainData, source: 'on-chain' });
    } catch (error) {
      console.error('Error in getStokFromBlockchain:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  getLacakPengembalianPbf: async (req, res) => {
    const { id } = req.params; // id pesanan
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
        return res.status(404).json({ success: false, message: 'Data pelacakan pengembalian tidak ditemukan atau Anda tidak berwenang.' });
      }

      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error in getLacakPengembalianPbf:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // --- FUNGSI INI YANG DIPERBAIKI ---
  getRiwayatByAssetId: async (req, res) => {
        const { assetId } = req.params;
        const idPbf = req.user.id; // ID PBF yang sedang login
        let gateway;

        try {
            gateway = await getPbfGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');
            
            // 1. Panggil chaincode untuk membaca data aset
            const resultBuffer = await contract.evaluateTransaction('readObat', assetId);
            const onChainData = JSON.parse(resultBuffer.toString());

            // 2. Tentukan alur berdasarkan riwayat on-chain
            const isApotekOrder = onChainData.riwayat.some(h => h.status === 'DIKIRIM_KE_APOTEK');
            
            let idPesanan;
            let offChainRows = [];
            
            // 3. Ekstrak ID Pesanan dari ID Aset
            const assetIdParts = assetId.split('-');
            
            if (isApotekOrder) {
                // INI ALUR PBF -> APOTEK
                idPesanan = assetIdParts[assetIdParts.length - 1]; // Ambil bagian terakhir
                const sql = `
                  SELECT 
                    pa.id, pa.nomor_pesanan, pa.status, pa.tanggal_pesanan, pa.total_harga, pa.updated_at,
                    sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, sjp.opsi_pengiriman,
                    pbf.nama_resmi AS nama_pbf,
                    apotek.nama_resmi AS nama_apotek,
                    pa.bukti_foto AS buktiPenerimaUrl
                  FROM pesanan_apotek pa
                  LEFT JOIN surat_jalan_pbf sjp ON pa.id = sjp.id_pesanan_apotek
                  LEFT JOIN users pbf ON pa.id_pbf = pbf.id
                  LEFT JOIN users apotek ON pa.id_apotek = apotek.id
                  WHERE pa.id = ? AND pa.id_pbf = ?
                `;
                [offChainRows] = await db.query(sql, [idPesanan, idPbf]);

            } else {
                // INI ALUR PRODUSEN -> PBF
                idPesanan = assetIdParts[assetIdParts.length - 1]; // Ambil bagian terakhir
                const sql = `
                  SELECT 
                    p.id, p.nomor_po, p.status, p.tanggal_pesanan, p.total_harga, p.updated_at,
                    sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, sjp.opsi_pengiriman,
                    pbf.nama_resmi AS nama_pbf,
                    produsen.nama_resmi AS nama_produsen,
                    p.bukti_foto AS buktiPenerimaUrl
                  FROM pesanan p
                  LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
                  LEFT JOIN users pbf ON p.id_pbf = pbf.id
                  LEFT JOIN users produsen ON p.id_produsen = produsen.id
                  WHERE p.id = ? AND p.id_pbf = ?
                `;
                [offChainRows] = await db.query(sql, [idPesanan, idPbf]);
            }
            
            // 4. Cek hasil query
            if (offChainRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Data pesanan off-chain tidak ditemukan atau Anda tidak berwenang.' });
            }

            // --- PERBAIKAN: TAMBAHKAN QUERY DETAIL_PESANAN ---
            const idPesananFromOffChain = offChainRows[0].id;
            const detailSql = isApotekOrder ? 
              `SELECT dp.*, pr.batch_id
               FROM detail_pesanan_apotek dp
               LEFT JOIN produksi pr ON dp.id_produksi = pr.id
               WHERE dp.id_pesanan_apotek = ?`
              :
              `SELECT dp.*, pr.batch_id
               FROM detail_pesanan dp
               LEFT JOIN produksi pr ON dp.id_produksi = pr.id
               WHERE dp.id_pesanan = ?`;
            
            const [detail_pesanan] = await db.query(detailSql, [idPesananFromOffChain]);
            // --- AKHIR PERBAIKAN ---

            return res.json({
                success: true,
                // Tambahkan detail_pesanan ke respons
                data: { onChain: onChainData, offChain: offChainRows[0], detail_pesanan: detail_pesanan }
            });

        } catch (error) {
            console.error(`Error fetching riwayat PBF for asset ${assetId}:`, error);
            const errorMessage = error.toString();
            if (errorMessage.includes('does not exist')) {
                 return res.status(404).json({ success: false, message: `Aset dengan ID ${assetId} tidak ditemukan di blockchain.` });
            }
            return res.status(500).json({ success: false, message: `Gagal mengambil data riwayat: ${error.message}` });
        } finally {
            if (gateway) gateway.disconnect();
        }
    },


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
      
      const dbCouch = nano.use('medisyncchannel_medisync');

      const prefix = 'PBF/IV/2025/';
      const [lastOrder] = await dbConnection.query(
        "SELECT nomor_po FROM pesanan WHERE nomor_po LIKE ? ORDER BY id DESC LIMIT 1",
        [`${prefix}%`]
      );
      let nextSeqNumber = 1; 
      if (lastOrder.length > 0) {
        const lastPoNumber = lastOrder[0].nomor_po; 
        const lastSeqStr = lastPoNumber.substring(prefix.length); 
        const lastSeqInt = parseInt(lastSeqStr, 10);
        nextSeqNumber = lastSeqInt + 1;
      }
      const newSequenceString = String(nextSeqNumber).padStart(4, '0');
      const generated_nomor_po = prefix + newSequenceString;

      for (const item of items) {
        const batchIdOnChain = item.id_produksi;
        try {
          const onChainDoc = await dbCouch.get(batchIdOnChain);
          if (item.jumlah_pesanan > onChainDoc.jumlah) {
            throw new Error(`Stok untuk ${onChainDoc.namaObat} (${onChainDoc.jumlah}) tidak cukup untuk pesanan (${item.jumlah_pesanan}).`);
          }
        } catch (couchError) {
          if (couchError.statusCode === 404) {
            throw new Error(`Obat dengan Batch ID ${batchIdOnChain} tidak ditemukan di blockchain.`);
          }
          throw couchError;
        }
      }
      
      const base64Data = tanda_tangan_data_url.replace(/^data:image\/png;base64,/, "");
      const fileName = `ttd-pesanan-${Date.now()}.png`;
      const filePath = path.join('uploads', 'tanda_tangan', fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, base64Data, 'base64');
      
      const total_harga = items.reduce((sum, item) => sum + (Number(item.jumlah_pesanan) * Number(item.harga_per_unit)), 0);

      const sqlPesanan = `
        INSERT INTO pesanan (
          nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
          nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
          tujuan_distribusi, catatan_khusus, tanda_tangan_apoteker, status, total_harga
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const paramsPesanan = [
        generated_nomor_po, 
        id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
        nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
        tujuan_distribusi || null, catatan_khusus || null, filePath, 'Perlu Dikirim', total_harga
      ];
      const [resultPesanan] = await dbConnection.query(sqlPesanan, paramsPesanan);
      const idPesanan = resultPesanan.insertId;

      for (const item of items) {
        const [produksiRows] = await dbConnection.query('SELECT id FROM produksi WHERE batch_id = ?', [item.id_produksi]);
        if (produksiRows.length === 0) {
          throw new Error(`Referensi produk off-chain untuk batch ID ${item.id_produksi} tidak ditemukan.`);
        }
        const idProduksiInteger = produksiRows[0].id;

        const sqlDetail = `INSERT INTO detail_pesanan (id_pesanan, id_produksi, nama_obat, bentuk_sediaan, dosis, jumlah_pesanan, harga_per_unit, total_harga) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        await dbConnection.query(sqlDetail, [
          idPesanan, idProduksiInteger, item.nama_obat, item.bentuk_sediaan, 
          item.dosis, item.jumlah_pesanan, item.harga_per_unit, item.total_harga
        ]);
        
        await dbConnection.query('UPDATE produksi SET jumlah = jumlah - ? WHERE id = ?', [item.jumlah_pesanan, idProduksiInteger]);
      }

      await dbConnection.commit();
      res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat!', idPesanan, nomorPo: generated_nomor_po });
    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in create:', error);
      res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  requestPembatalan: async (req, res) => {
    const { id } = req.params;
    const { alasan } = req.body;
    const idPbf = req.user.id;

    if (!alasan) {
      return res.status(400).json({ success: false, message: 'Alasan pembatalan wajib diisi.' });
    }

    try {
      const [pesanan] = await db.query(
        "SELECT id FROM pesanan WHERE id = ? AND id_pbf = ? AND status = 'Perlu Dikirim'",
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        return res.status(403).json({ success: false, message: "Pesanan tidak dapat dibatalkan atau tidak ditemukan." });
      }
      
      await db.query(
        "UPDATE pesanan SET status = 'Pembatalan Diajukan', catatan_khusus = ? WHERE id = ?",
        [`Dibatalkan oleh PBF. Alasan: ${alasan}`, id]
      );

      res.json({ success: true, message: "Pengajuan pembatalan berhasil dikirim." });
    } catch (error) {
      console.error('Error in requestPembatalan:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  konfirmasiPembatalan: async (req, res) => {
    try {
      const { id } = req.params;
      const idPbf = req.user.id;
      const [pesanan] = await db.query(
        "SELECT id FROM pesanan WHERE id = ? AND id_pbf = ? AND status = 'Pembatalan Diajukan'",
        [id, idPbf]
      );
      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau statusnya bukan "Pembatalan Diajukan".' });
      }
      await db.query("UPDATE pesanan SET status = 'Dibatalkan' WHERE id = ?", [id]);
      res.json({ success: true, message: 'Pembatalan pesanan berhasil dikonfirmasi.' });
    } catch (error) {
      console.error('Error in konfirmasiPembatalan:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  ajukanPengembalian: async (req, res) => {
    const { id } = req.params;
    const { alasan } = req.body;
    const idPbf = req.user.id;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Foto bukti wajib diunggah.' });
    }
    if (!alasan) {
        return res.status(400).json({ success: false, message: 'Alasan wajib diisi.' });
    }

    const buktiFotoPath = req.file.path.replace(/\\/g, '/'); // Normalisasi path
    const catatan = `Pengembalian Diajukan PBF. Alasan: ${alasan}`;

    let dbConnection;
    try {
        dbConnection = await db.getConnection();
        await dbConnection.beginTransaction();
        
        const [result] = await dbConnection.query(
           "UPDATE pesanan SET status = 'Pengembalian Diajukan', catatan_khusus = ?, bukti_foto = ? WHERE id = ? AND id_pbf = ? AND (status = 'Selesai' OR status = 'Dikirim')",
          [catatan, buktiFotoPath, id, idPbf]
        );

        if (result.affectedRows === 0) {
          throw new Error('Gagal mengajukan pengembalian. Pesanan tidak ditemukan atau statusnya bukan "Selesai" atau "Dikirim".');
        }
        
        await dbConnection.commit();
        res.json({ success: true, message: 'Pengajuan pengembalian berhasil dikirim.' });

    } catch (error) {
        if (dbConnection) await dbConnection.rollback();
        // Hapus file jika proses DB gagal
        try { await fs.unlink(req.file.path); } catch(e) {}
        res.status(500).json({ success: false, message: error.message || 'Kesalahan Server Internal' });
    } finally {
        if (dbConnection) dbConnection.release();
    }
},

   konfirmasiPenerimaan: async (req, res) => {
        const { id } = req.params; // ID Pesanan
        const idPbf = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
        }
        
        const buktiFotoPath = req.file.path;
        let gateway;
        let dbConnection;

        try {
            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();

            const [pesanan] = await dbConnection.query("SELECT id FROM pesanan WHERE id = ? AND id_pbf = ? AND status = 'Dikirim'", [id, idPbf]);
            if (pesanan.length === 0) {
                throw new Error('Pesanan tidak ditemukan atau statusnya bukan "Dikirim".');
            }

            const hashBuktiFoto = await calculateFileHash(buktiFotoPath);

            gateway = await getPbfGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            // --- AMBIL ID ASET DARI DETAIL_PESANAN ---
            const [items] = await dbConnection.query("SELECT id_aset_blockchain FROM detail_pesanan WHERE id_pesanan = ?", [id]);
            if (items.length === 0) {
                throw new Error('Tidak ada detail item yang ditemukan untuk pesanan ini.');
            }

            for (const item of items) {
                if (!item.id_aset_blockchain) {
                    console.warn(`Item pesanan (ID: ${id}) tidak memiliki asset blockchain, dilewati.`);
                    continue;
                }
                const transaction = contract.createTransaction('PbfContract:terimaBarang');
                // Endorsing policy mungkin perlu disesuaikan
                // transaction.setEndorsingOrganizations('PBFMSP', 'ProdusenMSP'); 
                await transaction.submit(item.id_aset_blockchain, hashBuktiFoto);
            }
            // --- AKHIR PERUBAHAN ---

            // Simpan path foto ke 'bukti_foto' BUKAN 'catatan_khusus'
            await dbConnection.query("UPDATE pesanan SET status = 'Selesai', bukti_foto = ? WHERE id = ?", [buktiFotoPath, id]);
            
            await dbConnection.commit();
            res.json({ success: true, message: 'Pesanan berhasil dikonfirmasi selesai dan kepemilikan aset di blockchain telah ditransfer.' });
        } catch (error) {
            if (dbConnection) await dbConnection.rollback();
            // Cek apakah file ada sebelum menghapus
            if (buktiFotoPath) {
                try { await fs.unlink(buktiFotoPath); } catch(e) { console.error("Gagal hapus file bukti:", e);}
            }
            res.status(500).json({ success: false, message: `Gagal konfirmasi: ${error.message}` });
        } finally {
            if (gateway) gateway.disconnect();
            if (dbConnection) dbConnection.release();
        }
    },
  
  acknowledgeRejection: async (req, res) => {
    const { id } = req.params;
    const idPbf = req.user.id;

    try {
      // Pastikan pesanan ada dan statusnya benar
      const [pesanan] = await db.query(
        "SELECT id FROM pesanan WHERE id = ? AND id_pbf = ? AND status = 'Pembatalan Ditolak'",
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau statusnya tidak valid.' });
      }

      // Kembalikan statusnya ke 'Dibatalkan' sesuai alur kloning
      await db.query(
        "UPDATE pesanan SET status = 'Dibatalkan' WHERE id = ?",
        [id]
      );

      res.json({ success: true, message: 'Pesanan lama telah dibatalkan.' });

    } catch (error) {
      console.error('Error in acknowledgeRejection:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },
  
  uploadPenerimaanMiddleware: uploadPenerimaan,
  uploadPengembalianMiddleware: uploadPengembalian
};

module.exports = pesananController;

