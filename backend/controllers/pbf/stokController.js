// backend/controllers/pbf/stokController.js
'use strict';
const db = require('../../config/db');

const stokController = {
  getStokData: async (req, res) => {
    const idPbf = req.user.id;
    try {
      // Query utama untuk mengambil daftar semua stok yang dimiliki PBF (dari pesanan yang 'Selesai')
      const sqlStokList = `
        SELECT 
          dp.id AS detail_pesanan_id,
          pr.batch_id, 
          dp.nama_obat, 
          dp.jumlah_pesanan AS stok, 
          pr.tanggal_kadaluarsa,
          produsen.nama_resmi AS nama_produsen
        FROM detail_pesanan dp
        JOIN pesanan p ON dp.id_pesanan = p.id
        JOIN produksi pr ON dp.id_produksi = pr.id
        JOIN users produsen ON pr.id_produsen = produsen.id
        WHERE p.id_pbf = ? AND p.status = 'Selesai'
        ORDER BY pr.tanggal_kadaluarsa ASC
      `;
      const [stokList] = await db.query(sqlStokList, [idPbf]);

      // Menghitung statistik dari data yang didapat
      let totalStok = 0;
      let stokMenipis = 0;
      stokList.forEach(item => {
        totalStok += item.stok;
        if (item.stok > 0 && item.stok < 1000) { // Batas stok menipis
          stokMenipis += item.stok;
        }
      });

      // TODO: Logika untuk "Distribusi Bulan Ini" perlu mengambil data dari pesanan ke apotek
      // Untuk saat ini, kita akan mengisinya dengan 0
      const distribusiBulanIni = 0; 

      const responseData = {
        stats: {
          totalStok,
          distribusiBulanIni,
          stokMenipis,
        },
        stokList: stokList,
      };

      res.json({ success: true, data: responseData });

    } catch (error) {
      console.error('Error in getStokData (PBF):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  }
};

module.exports = stokController;