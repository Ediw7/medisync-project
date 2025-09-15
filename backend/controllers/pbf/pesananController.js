'use strict';

const db = require('../../config/db');
const fs = require('fs');
const path = require('path');
// Pastikan Anda menginstal nano: npm install nano
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);


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

  // ==============================================================
  // ========= FUNGSI BARU UNTUK BATAL PESANAN DITAMBAHKAN DI SINI =
  // ==============================================================
  batalkanPesanan: async (req, res) => {
    try {
      const { id } = req.params;       // ID Pesanan dari URL (misal: /pesanan/14/batalkan)
      const idPbf = req.user.id;       // ID PBF yang sedang login (dari token JWT)
      const { alasanPembatalan } = req.body; // Data dari frontend BatalPesanan.jsx

      if (!alasanPembatalan || alasanPembatalan.length === 0) {
        return res.status(400).json({ success: false, message: 'Alasan pembatalan wajib diisi.' });
      }

      // Gabungkan array alasan menjadi satu string untuk disimpan di kolom catatan
      const catatan = "Dibatalkan oleh PBF. Alasan: " + alasanPembatalan.join(', ');

      // Query SQL untuk UPDATE status DAN menyimpan alasan pembatalan
      // Penting: Kita tambahkan cek AND id_pbf = ? DAN status = 'Perlu Dikirim'
      // Ini memastikan PBF hanya bisa membatalkan pesanannya sendiri, 
      // dan HANYA jika statusnya belum diproses oleh Produsen.
      const sql = `
        UPDATE pesanan 
        SET 
          status = 'Dikembalikan',  -- Set status ke Dikembalikan (pastikan 'Dikembalikan' ada di ENUM Anda)
          catatan_khusus = ?      -- Simpan alasannya di catatan
        WHERE 
          id = ? AND                
          id_pbf = ? AND            
          status = 'Perlu Dikirim'  
      `;

      const [result] = await db.query(sql, [catatan, id, idPbf]);

      // Jika tidak ada baris yang terpengaruh (affectedRows == 0)
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Gagal membatalkan pesanan. Pesanan mungkin tidak ditemukan, bukan milik Anda, atau statusnya sudah berubah (sudah dikirim).' 
        });
      }

      // Jika berhasil
      res.json({ success: true, message: 'Pesanan telah berhasil dibatalkan.' });

    } catch (error) {
      console.error('Error in pbf.batalkanPesanan:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
  }
  
};

module.exports = pesananController;