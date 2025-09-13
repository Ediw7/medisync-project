'use strict';

const db = require('../../config/db');
const fs = require('fs');
const path = require('path');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`); // Fix: Ganti password jadi 'adminpw' sesuai docker-compose

// Fungsi untuk mengambil data produksi dari CouchDB (on-chain)
async function fetchFromCouchDB(idProdusen) {
  try {
    const dbName = 'medisyncchannel_';  // Asumsi nama channel/channel, sesuaikan jika beda (misal 'medisyncchannel_medisync')
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
      id: doc.id, // _id dari CouchDB
      batch_id: doc.id, // batch_id = id di CouchDB
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
    console.log('Mapped CouchDB data sample:', mappedData[0]); // Log untuk debug
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
    console.log('MySQL fallback data sample:', rows[0]); // Log untuk debug
    return rows;
  } catch (error) {
    console.error('Error fetching from MySQL:', error.message, error.stack);
    return [];
  }
}

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
        LEFT JOIN produksi pr ON dp.id_produksi = pr.id
        WHERE dp.id_pesanan = ?
      `;
      const [detail] = await db.query(sqlDetail, [id]);

      // Verifikasi total_harga dari detail jika kosong
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

      const mappedData = onChainData.map(doc => ({
        id: doc.id,
        batch_id: doc.id,
        nama_obat: doc.namaObat,
        bentuk_sediaan: doc.bentukSediaan,
        dosis: doc.dosis,
        jumlah: doc.jumlah || 0,
        tanggal_produksi: doc.tanggalProduksi,
        tanggal_kadaluarsa: doc.tanggalKadaluarsa,
        penanggung_jawab: doc.penanggungJawab,
        harga_per_unit: doc.harga_per_unit || 0,
        nama_perusahaan: 'PT Medisync',
      }));
      
      res.json({ success: true, data: mappedData, source: 'on-chain' });
    } catch (error) {
      console.error('Error in getStokFromBlockchain:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // Membuat pesanan baru
  create: async (req, res) => {
    const {
      nomor_po, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
      nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
      tujuan_distribusi, catatan_khusus, items, tanda_tangan_data_url
    } = req.body;
    const id_pbf = req.user.id;

    let dbConnection;
    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // 1. Validasi pesanan terhadap "sumber kebenaran" (blockchain) - Fix: Handling auth & fallback
      let couchValidationFailedItems = [];
      let couchAuthError = false;
      const dbName = 'medisyncchannel_medisync';  // Sesuaikan dengan nama DB di Fabric channel kamu
      const dbCouch = nano.use(dbName);
      for (const item of items) {
        const batchId = String(item.id_produksi);
        console.log(`Validating batch ID: ${batchId} (type: ${typeof batchId})`);
        try {
          const onChainDoc = await dbCouch.get(batchId);
          if (!onChainDoc) {
            throw new Error(`Dokumen tidak ditemukan.`);
          }
          if (item.jumlah_pesanan > onChainDoc.jumlah) {
            throw new Error(`Stok untuk ${onChainDoc.namaObat} (${onChainDoc.jumlah}) tidak mencukupi untuk pesanan (${item.jumlah_pesanan}).`);
          }
          console.log(`Validasi sukses untuk ${onChainDoc.namaObat}, stok: ${onChainDoc.jumlah}`);
        } catch (couchError) {
          console.warn(`CouchDB validation gagal untuk batch ${batchId}: ${couchError.message}`);
          if (couchError.error === 'unauthorized' && couchError.reason.includes('Name or password')) {
            console.error('CouchDB auth gagal global. Skip validasi CouchDB, fallback ke MySQL untuk semua item.');
            couchAuthError = true;
            break;  // Stop loop, fallback semua
          } else if (couchError.statusCode === 404) {
            couchValidationFailedItems.push(batchId);
          } else {
            throw couchError;
          }
        }
      }

      // Fallback: Jika auth gagal atau ada item gagal, validasi via MySQL
      if (couchAuthError || couchValidationFailedItems.length > 0) {
        console.log(`Fallback ke MySQL untuk ${couchAuthError ? 'semua item (auth error)' : couchValidationFailedItems.length + ' item(s)'}`);
        const mysqlStok = await fetchFromMySQL(id_produsen);
        const stokMap = new Map(mysqlStok.map(s => [String(s.id), s]));
        const itemsToValidate = couchAuthError ? items : items.filter(i => couchValidationFailedItems.includes(String(i.id_produksi)));
        for (const item of itemsToValidate) {
          const failedId = String(item.id_produksi);
          const stokItem = stokMap.get(failedId);
          if (!stokItem) {
            throw new Error(`Item dengan ID ${failedId} tidak ditemukan di stok fallback.`);
          }
          if (item.jumlah_pesanan > stokItem.jumlah) {
            throw new Error(`Stok fallback untuk ${stokItem.nama_obat} (${stokItem.jumlah}) tidak mencukupi (${item.jumlah_pesanan}).`);
          }
          console.log(`Fallback sukses untuk ${stokItem.nama_obat}`);
        }
      }
      
      // 2. Simpan tanda tangan
      const base64Data = tanda_tangan_data_url.replace(/^data:image\/png;base64,/, "");
      const fileName = `ttd-pesanan-${Date.now()}.png`;
      const filePath = path.join('uploads', 'tanda_tangan', fileName);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, base64Data, 'base64');
      
      const total_harga = items.reduce((sum, item) => sum + (item.total_harga || 0), 0);

      // 3. Simpan pesanan ke database operasional (off-chain)
      const sqlPesanan = `
        INSERT INTO pesanan (
          nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
          nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
          tujuan_distribusi, catatan_khusus, tanda_tangan_apoteker, status, total_harga
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const paramsPesanan = [
        nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
        nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
        tujuan_distribusi || null, catatan_khusus || null, filePath, 'Dipesan', total_harga
      ];
      const [resultPesanan] = await dbConnection.query(sqlPesanan, paramsPesanan);
      const idPesanan = resultPesanan.insertId;

      // 4. Simpan detail pesanan ke database operasional (off-chain)
      for (const item of items) {
        const sqlDetail = `
          INSERT INTO detail_pesanan (
            id_pesanan, id_produksi, nama_obat, bentuk_sediaan, dosis, jumlah_pesanan, harga_per_unit, total_harga
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await dbConnection.query(sqlDetail, [
          idPesanan, item.id_produksi, item.nama_obat, item.bentuk_sediaan, 
          item.dosis, item.jumlah_pesanan, item.harga_per_unit, item.total_harga
        ]);
      }
      
      // TIDAK ADA PENGURANGAN STOK DI SINI. ITU TUGAS PRODUSEN.

      await dbConnection.commit();
      res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat!', idPesanan });
    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in create:', error);
      res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  }
};

module.exports = pesananController;