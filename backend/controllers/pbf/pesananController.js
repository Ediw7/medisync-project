'use strict';

const db = require('../../config/db');
const fs = require('fs');
const path = require('path');
const nano = require('nano')('http://admin:admin@127.0.0.1:5984'); // Koneksi ke CouchDB lokal (sesuaikan port jika CouchDB di port lain)

// Fungsi untuk mengambil data produksi dari CouchDB (on-chain)
async function fetchFromCouchDB(idProdusen) {
  try {
    const dbName = 'medisyncchannel_'; // Nama database CouchDB untuk channel
    const dbInstance = nano.use(dbName);
    const result = await dbInstance.find({
      selector: {
        docType: 'obat',
        pemilikSaatIni: 'ProdusenMSP', // Asumsi data masih di ProdusenMSP
        // Tambahkan filter berdasarkan id_produsen jika ada field tersebut di CouchDB
        // Misalnya: id_produsen: idProdusen
      },
      fields: ['id', 'namaObat', 'bentukSediaan', 'dosis', 'tanggalProduksi', 'tanggalKadaluarsa', 'penanggungJawab', 'jumlah'], // Fields yang diperlukan
      limit: 50, // Limit hasil
    });
    // Map hasil ke format yang mirip MySQL
    return result.docs.map(doc => ({
      id: doc.id,
      batch_id: doc.id, // Asumsi batch_id sama dengan id di CouchDB
      nama_obat: doc.namaObat,
      bentuk_sediaan: doc.bentukSediaan,
      dosis: doc.dosis,
      jumlah: doc.jumlah || 100, // Default jika tidak ada
      tanggal_produksi: doc.tanggalProduksi,
      tanggal_kadaluarsa: doc.tanggalKadaluarsa,
      penanggung_jawab: doc.penanggungJawab,
      nama_perusahaan: 'PT Medisync', // Atau ambil dari users jika perlu
    }));
  } catch (error) {
    console.error('Error fetching from CouchDB:', error);
    return []; // Fallback ke array kosong jika CouchDB gagal
  }
}

// Fungsi fallback ke XAMPP/MySQL jika CouchDB kosong
async function fetchFromMySQL(idProdusen) {
  const [rows] = await db.query(`
    SELECT p.id, p.batch_id, p.nama_obat, p.bentuk_sediaan, p.dosis, p.jumlah, 
           p.tanggal_produksi, p.tanggal_kadaluarsa, p.penanggung_jawab
    FROM produksi p
    WHERE p.id_produsen = ? AND p.status = 'Tercatat di Blockchain'
    ORDER BY p.tanggal_produksi DESC
  `, [idProdusen]);
  return rows;
}

const pesananController = {
  // Mengambil daftar semua pesanan milik PBF yang sedang login
  getAll: async (req, res) => {
    try {
      const sql = `
        SELECT 
          p.id, p.nomor_po, p.tanggal_pesanan, p.status, 
          u.nama_resmi AS nama_produsen, p.nama_pbf, p.alamat_pbf
        FROM pesanan p
        JOIN users u ON p.id_produsen = u.id
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
        LEFT JOIN produksi pr ON dp.id_produksi = pr.id
        WHERE dp.id_pesanan = ?
      `;
      const [detail] = await db.query(sqlDetail, [id]);

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
    
    // Map field CouchDB ke format yang diharapkan frontend (jumlah sekarang ada)
    const mappedData = onChainData.map(doc => ({
      id: doc.id,
      batch_id: doc.id,
      nama_obat: doc.namaObat,
      bentuk_sediaan: doc.bentukSediaan,
      dosis: doc.dosis,
      jumlah: doc.jumlah || 0, // Sekarang ada di CouchDB
      tanggal_produksi: doc.tanggalProduksi,
      tanggal_kadaluarsa: doc.tanggalKadaluarsa,
      penanggung_jawab: doc.penanggungJawab,
      harga_per_unit: doc.hargaPerUnit || 0,
      nama_perusahaan: 'PT Medisync', // Atau ambil dari users
    }));
    
    res.json({ success: true, data: mappedData, source: 'on-chain' });
  } catch (error) {
    console.error('Error in getStokFromBlockchain:', error);
    res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
  }
},

  // Membuat pesanan baru (tetap gunakan off-chain untuk stok, tapi bisa diubah ke on-chain jika diperlukan)
  create: async (req, res) => {
    const {
      nomor_po,
      id_produsen,
      nama_pbf,
      alamat_pbf,
      nomor_siup,
      nomor_sia_sika,
      nama_apoteker,
      nomor_sipa,
      kontak_telepon,
      kontak_email,
      tanggal_pesanan,
      tujuan_distribusi,
      catatan_khusus,
      items, // Array of { id_produksi, jumlah_pesanan, harga_per_unit, total_harga }
      tanda_tangan_data_url
    } = req.body;
    const id_pbf = req.user.id;

    // Validasi field wajib
    if (!nomor_po || !id_produsen || !nama_pbf || !alamat_pbf || !nomor_siup ||
      !nomor_sia_sika || !nama_apoteker || !nomor_sipa || !kontak_telepon || !kontak_email ||
      !tanggal_pesanan || !items || !Array.isArray(items) || items.length === 0 || !tanda_tangan_data_url) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi dan minimal satu item pesanan serta tanda tangan diperlukan.' });
    }

    let dbConnection;
    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // Validasi id_produsen
      const [produsen] = await dbConnection.query("SELECT id FROM users WHERE id = ? AND role = 'produsen'", [id_produsen]);
      if (produsen.length === 0) {
        throw new Error('Produsen tidak ditemukan.');
      }

      // Simpan tanda tangan dari base64 ke file
      const base64Data = tanda_tangan_data_url.replace(/^data:image\/png;base64,/, "");
      const fileName = `ttd-pesanan-${Date.now()}.png`;
      const filePath = path.join('uploads', 'tanda_tangan', fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, base64Data, 'base64');

      // Insert data pesanan
      const sqlPesanan = `
        INSERT INTO pesanan (
          nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
          nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
          tujuan_distribusi, catatan_khusus, tanda_tangan_apoteker, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const paramsPesanan = [
        nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
        nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
        tujuan_distribusi || null, catatan_khusus || null, filePath, 'Perlu Dikirim'
      ];

      const [resultPesanan] = await dbConnection.query(sqlPesanan, paramsPesanan);
      const idPesanan = resultPesanan.insertId;

      // Insert detail pesanan dan validasi stok dari CouchDB (on-chain)
      for (const item of items) {
        const { id_produksi, jumlah_pesanan, harga_per_unit, total_harga } = item;
        if (!id_produksi || !jumlah_pesanan || jumlah_pesanan <= 0) {
          throw new Error('ID produksi dan jumlah pesanan wajib diisi dan harus lebih dari 0.');
        }

        // Ambil data dari CouchDB (on-chain) untuk validasi
        const onChainData = await fetchFromCouchDB(id_produsen);
        const selectedObat = onChainData.find((o) => o.id === id_produksi);
        if (!selectedObat) {
          throw new Error(`Obat dengan ID ${id_produksi} tidak ditemukan di blockchain.`);
        }
        if (jumlah_pesanan > selectedObat.jumlah) {
          throw new Error(`Jumlah pesanan (${jumlah_pesanan}) melebihi stok tersedia di blockchain (${selectedObat.jumlah}).`);
        }

        const sqlDetail = `
          INSERT INTO detail_pesanan (
            id_pesanan, id_produksi, nama_obat, bentuk_sediaan, dosis, jumlah_pesanan, harga_per_unit, total_harga
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const paramsDetail = [
          idPesanan,
          id_produksi,
          selectedObat.namaObat, // Dari on-chain
          selectedObat.bentukSediaan, // Dari on-chain
          selectedObat.dosis, // Dari on-chain
          jumlah_pesanan,
          harga_per_unit || null,
          total_harga || null
        ];
        await dbConnection.query(sqlDetail, paramsDetail);

        // Kurangi stok di off-chain (MySQL) untuk sinkronisasi, tapi on-chain tetap immutable
        await dbConnection.query(
          'UPDATE produksi SET jumlah = jumlah - ? WHERE id = ?',
          [jumlah_pesanan, id_produksi]
        );
      }

      await dbConnection.commit();
      res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat!', idPesanan });
    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in create:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Nomor PO sudah digunakan.' });
      }
      res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  }
};

module.exports = pesananController;