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
async function getGateway() {
  try {
    // 1. Tentukan path ke wallet yang sudah ada
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // 2. Pastikan identitas admin PBF ada di dalam wallet
    const identity = await wallet.get('pbfAdmin');
    if (!identity) {
        throw new Error('Identitas "pbfAdmin" tidak ditemukan di dalam wallet. Jalankan enrollAdminPbf.js terlebih dahulu.');
    }

    // 3. Muat connection profile untuk Organisasi 2 (PBF)
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json');
    const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

    // 4. Buat koneksi gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'pbfAdmin', // Gunakan identitas PBF dari wallet
        discovery: { enabled: true, asLocalhost: true }
    });

    console.log('Gateway connection for PBF established');
    return gateway;

  } catch (error) {
    console.error('Error initializing PBF gateway:', error);
    throw new Error(`Gagal menginisialisasi koneksi ke blockchain: ${error.message}`);
  }
}

// --- KONFIGURASI MULTER UNTUK FILE UPLOAD ---
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'Uploads/bukti_pengembalian';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `order-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, JPEG) yang diizinkan!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 1024 * 1024 * 5 } });

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
        SELECT p.*, u.nama_resmi AS nama_produsen
        FROM pesanan p
        JOIN users u ON p.id_produsen = u.id
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

      res.json({
        success: true,
        data: {
          pesanan: pesanan[0],
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

  getRiwayatByAssetId: async (req, res) => {
    const { assetId } = req.params;
    const idPbf = req.user.id; // Ambil ID PBF yang sedang login
    let gateway;

    try {
      gateway = await getGateway(); // Fungsi getGateway PBF
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      // Gunakan readObat dari ProdusenContract karena PBF juga perlu membaca aset yang sama
      const resultBuffer = await contract.evaluateTransaction('ProdusenContract:readObat', assetId);
      const onChainData = JSON.parse(resultBuffer.toString());
      
      // Ambil ID pesanan dari ID aset (misal: "BATCH-001-106" -> "106")
      const idPesanan = onChainData.id.substring(onChainData.id.lastIndexOf('-') + 1);

      const sql = `
        SELECT 
          p.id, p.nomor_po, p.status, p.tanggal_pesanan,
          sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, sjp.opsi_pengiriman,
          pbf.nama_resmi AS nama_pbf,
          produsen.nama_resmi AS nama_produsen,
          p.bukti_foto AS buktiPenerimaUrl
        FROM pesanan p
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        JOIN users pbf ON p.id_pbf = pbf.id
        JOIN users produsen ON p.id_produsen = produsen.id
        WHERE p.id = ? AND p.id_pbf = ?
      `;
      const [offChainRows] = await db.query(sql, [idPesanan, idPbf]);

      if (offChainRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data pesanan off-chain tidak ditemukan atau Anda tidak berwenang.' });
      }

      return res.json({
        success: true,
        data: { onChain: onChainData, offChain: offChainRows[0] }
      });

    } catch (error) {
      console.error(`Error fetching riwayat PBF for asset ${assetId}:`, error);
      return res.status(500).json({
        success: false,
        message: `Gagal mengambil data riwayat: ${error.message}`
      });
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
      const filePath = path.join('Uploads', 'tanda_tangan', fileName);
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
    try {
      const { id } = req.params;
      const idPbf = req.user.id;
      const { alasan } = req.body;
      
      if (!req.file) return res.status(400).json({ success: false, message: 'Foto bukti wajib diunggah.' });
      if (!alasan) return res.status(400).json({ success: false, message: 'Alasan wajib diisi.' });

      const buktiFotoPath = req.file.path;
      const catatan = `Pengembalian Diajukan PBF. Alasan: ${alasan}. Bukti: ${buktiFotoPath}`;

      const [result] = await db.query(
        "UPDATE pesanan SET status = 'Pengembalian Diajukan', catatan_khusus = ? WHERE id = ? AND id_pbf = ? AND status = 'Selesai'",
        [catatan, id, idPbf]
      );

      if (result.affectedRows === 0) {
        await fs.unlink(buktiFotoPath);
        return res.status(404).json({ success: false, message: 'Gagal mengajukan pengembalian. Pesanan tidak ditemukan atau statusnya bukan "Selesai".' });
      }
      res.json({ success: true, message: 'Pengajuan pengembalian berhasil dikirim.' });
    } catch (error) {
      if (req.file) await fs.unlink(req.file.path);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
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

            gateway = await getGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            const [items] = await dbConnection.query("SELECT pr.batch_id FROM detail_pesanan dp JOIN produksi pr ON dp.id_produksi = pr.id WHERE dp.id_pesanan = ?", [id]);
            for (const item of items) {
                const transaction = contract.createTransaction('PbfContract:terimaBarang');
                transaction.setEndorsingOrganizations('PBFMSP');
                await transaction.submit(item.batch_id, hashBuktiFoto);
            }

            await dbConnection.query("UPDATE pesanan SET status = 'Selesai', catatan_khusus = ? WHERE id = ?", [`Bukti penerimaan: ${buktiFotoPath}`, id]);
            
            await dbConnection.commit();
            res.json({ success: true, message: 'Pesanan berhasil dikonfirmasi selesai dan kepemilikan aset di blockchain telah ditransfer.' });
        } catch (error) {
            if (dbConnection) await dbConnection.rollback();
            if (fs.existsSync(buktiFotoPath)) fs.unlinkSync(buktiFotoPath); // Hapus file jika gagal
            res.status(500).json({ success: false, message: `Gagal konfirmasi: ${error.message}` });
        } finally {
            if (gateway) gateway.disconnect();
            if (dbConnection) dbConnection.release();
        }
    },
  
  uploadMiddleware: upload
};

module.exports = pesananController;