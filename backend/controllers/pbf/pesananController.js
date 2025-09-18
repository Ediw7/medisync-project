'use strict';

const db = require('../../config/db');
const fs = require('fs');
const path = require('path');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);

// --- KONFIGURASI MULTER UNTUK FILE UPLOAD ---
// Anda lupa menambahkan ini
const multer = require('multer');

// Tentukan lokasi penyimpanan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_pengembalian';
    // Buat direktori jika belum ada
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Buat nama file unik: order-[idPesanan]-[timestamp].[ext]
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `order-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

// Filter file (hanya izinkan gambar)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, JPEG) yang diizinkan!'), false);
  }
};

// Inisialisasi Multer
// 'buktiFoto' harus sama dengan nama field di FormData frontend
const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 1024 * 1024 * 5 } }); // Batas 5MB
// --- AKHIR KONFIGURASI MULTER ---


async function fetchFromCouchDB(idProdusen) {
  try {
    const dbName = process.env.COUCHDB_DB || 'medisyncchannel_medisync';
    const dbInstance = nano.use(dbName);
    const result = await dbInstance.find({
      selector: {
        docType: 'obat',
        pemilikSaatIni: 'ProdusenMSP', // Hanya ambil stok milik Produsen
      },
      // Sesuaikan fields dengan data yang Anda butuhkan di frontend
      fields: ['id', 'namaObat', 'bentukSediaan', 'dosis', 'tanggalProduksi', 'tanggalKadaluarsa', 'penanggungJawab', 'jumlah', 'hargaPerUnit'],
      limit: 50, // Batasi jumlah data untuk performa
      skip: 0,
    });
    console.log('CouchDB query result:', result.docs.length, 'documents');
    // Mapping nama field CouchDB (camelCase) ke nama field yang diharapkan frontend (snake_case)
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
      nama_perusahaan: 'PT Medisync', // Asumsi statis
    }));
    console.log('Mapped CouchDB data sample:', mappedData[0]);
    return mappedData;
  } catch (error) {
    console.error('Error fetching from CouchDB:', error.message, error.stack);
    return [];
  }
}

// Fungsi fallback ke XAMPP/MySQL jika CouchDB kosong
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

// --- HANYA ADA SATU 'pesananController' ---
const pesananController = {
  // Mengambil daftar semua pesanan milik PBF yang sedang login
  getAll: async (req, res) => {
    try {
      const sql = `
        SELECT 
          p.id, p.nomor_po, p.tanggal_pesanan, p.status AS status, 
          p.nama_pbf, p.alamat_pbf, COALESCE(p.total_harga, 0) AS total_harga
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

  // Mengambil detail pesanan berdasarkan ID
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

  // Endpoint untuk stok obat dari CouchDB (on-chain)
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

      // Note: Data dari CouchDB sudah di-map di dalam helper fetchFromCouchDB
      // Kita kembalikan langsung data yang sudah di-map.
      res.json({ success: true, data: onChainData, source: 'on-chain' });
    } catch (error) {
      console.error('Error in getStokFromBlockchain:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // Membuat pesanan baru
  create: async (req, res) => {
        const {
            /* nomor_po DIHAPUS DARI SINI */
            id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
            nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
            tujuan_distribusi, catatan_khusus, items, tanda_tangan_data_url
        } = req.body;
        const id_pbf = req.user.id;

        let dbConnection;
        try {
            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();
            
            const dbCouch = nano.use('medisyncchannel_medisync'); // Pastikan nama DB Couch benar

            // --- AWAL BLOK GENERATOR NOMOR PO ---
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
            // --- AKHIR BLOK GENERATOR NOMOR PO ---

            // Validasi stok di blockchain
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
                    throw couchError; // Lempar error lain (koneksi, dll)
                }
            }
            
            // Simpan Tanda Tangan
            const base64Data = tanda_tangan_data_url.replace(/^data:image\/png;base64,/, "");
            const fileName = `ttd-pesanan-${Date.now()}.png`;
            const filePath = path.join('uploads', 'tanda_tangan', fileName);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, base64Data, 'base64');
            
            const total_harga = items.reduce((sum, item) => sum + (Number(item.jumlah_pesanan) * Number(item.harga_per_unit)), 0);

            // Insert data pesanan
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

            // Simpan detail pesanan dan kurangi stok di MySQL (sebagai referensi)
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
                
                // Kurangi juga stok di MySQL (meskipun sumber utamanya CouchDB, ini untuk sinkronisasi data internal)
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
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    // --- FUNGSI BARU UNTUK PENGAJUAN PENGEMBALIAN OLEH PBF ---
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
                fs.unlinkSync(buktiFotoPath);
                return res.status(404).json({ success: false, message: 'Gagal mengajukan pengembalian. Pesanan tidak ditemukan atau statusnya bukan "Selesai".' });
            }
            res.json({ success: true, message: 'Pengajuan pengembalian berhasil dikirim.' });
        } catch (error) {
            if (req.file) fs.unlinkSync(req.file.path);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    // Ekspor middleware multer agar bisa digunakan di rute
    uploadMiddleware: upload
  
}; // <-- Objek ditutup di sini

module.exports = pesananController;