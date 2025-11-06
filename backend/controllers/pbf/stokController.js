'use strict';
const db = require('../../config/db');

const stokController = {
  // --- FUNGSI 1: Mengambil semua data stok dan statistik ---
  // --- FUNGSI 1: Mengambil semua data stok dan statistik ---
  getStokData: async (req, res) => {
    const idPbf = req.user.id;
    try {
      // Query utama untuk mengambil daftar stok (Tidak berubah)
      const sqlStokList = `
        SELECT 
          dp.id AS detail_pesanan_id,
          pr.batch_id, 
          dp.nama_obat, 
          dp.jumlah_pesanan AS stok, 
          pr.tanggal_kadaluarsa,
          produsen.nama_resmi AS nama_produsen,
          dp.id_aset_blockchain -- <--- Sebaiknya ambil ini juga
        FROM detail_pesanan dp
        JOIN pesanan p ON dp.id_pesanan = p.id
        JOIN produksi pr ON dp.id_produksi = pr.id
        JOIN users produsen ON pr.id_produsen = produsen.id
        WHERE p.id_pbf = ? AND p.status = 'Selesai'
        ORDER BY pr.tanggal_kadaluarsa ASC
      `;
      const [stokList] = await db.query(sqlStokList, [idPbf]);

      // --- PERBAIKAN STATISTIK: Query baru untuk Distribusi ---
      const sqlDistribusi = `
        SELECT SUM(dpa.jumlah) AS totalDistribusi
        FROM detail_pesanan_apotek dpa
        JOIN pesanan_apotek pa ON dpa.id_pesanan_apotek = pa.id
        JOIN surat_jalan_pbf sjp ON pa.id = sjp.id_pesanan_apotek
        WHERE pa.id_pbf = ?
          AND pa.status IN ('Dikirim', 'Selesai')
          AND MONTH(sjp.tanggal_pengiriman) = MONTH(CURDATE())
          AND YEAR(sjp.tanggal_pengiriman) = YEAR(CURDATE())
      `;
      const [distribusiRows] = await db.query(sqlDistribusi, [idPbf]);
      const distribusiBulanIni = distribusiRows[0].totalDistribusi || 0;
      // --- AKHIR PERBAIKAN STATISTIK ---

      // Menghitung statistik (Tidak berubah)
      let totalStok = 0;
      let stokMenipis = 0;
      stokList.forEach(item => {
        totalStok += item.stok;
        if (item.stok > 0 && item.stok < 2000) {
          stokMenipis += item.stok;
        }
      });

      const responseData = {
        stats: {
          totalStok,
          distribusiBulanIni, // <-- Sekarang menggunakan data dari query
          stokMenipis,
        },
        stokList: stokList,
      };

      res.json({ success: true, data: responseData });

    } catch (error) {
      console.error('Error in getStokData (PBF):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // --- FUNGSI 2: Mengambil detail satu item stok ---
  // --- FUNGSI 2: Mengambil detail satu item stok ---
  getStokDetailById: async (req, res) => {
    const { id } = req.params; // Ini adalah detail_pesanan_id
    const idPbf = req.user.id;

    try {
      const sql = `
        SELECT 
          dp.id,
          dp.id_aset_blockchain, -- <--- PERBAIKAN DI SINI
          dp.nama_obat,
          dp.jumlah_pesanan AS stok,
          dp.harga_per_unit,
          pr.batch_id,
          pr.nomor_izin_edar,
          pr.dosis,
          pr.bentuk_sediaan,
          pr.tanggal_produksi,
          pr.tanggal_kadaluarsa,
          pr.komposisi_obat,
          pr.hash_sertifikat_analisis,
          pr.dokumen_bpom_path,
          pr.sertifikat_analisis_path,
          produsen.nama_resmi as nama_produsen
        FROM detail_pesanan dp
        JOIN produksi pr ON dp.id_produksi = pr.id
        JOIN pesanan p ON dp.id_pesanan = p.id
        JOIN users produsen ON pr.id_produsen = produsen.id
        WHERE dp.id = ? AND p.id_pbf = ?
      `;
      
      const [rows] = await db.query(sql, [id, idPbf]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Detail stok tidak ditemukan atau Anda tidak memiliki akses.' });
      }

      res.json({ success: true, data: rows[0] });

    } catch (error) {
      console.error('Error in getStokDetailById (PBF):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  }
};

module.exports = stokController;
