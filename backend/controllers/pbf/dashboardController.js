// backend/controllers/pbf/dashboardController.js
'use strict';
const db = require('../../config/db');

const dashboardController = {
  getDashboardData: async (req, res) => {
    const idPbf = req.user.id;
    try {
      // --- 1. Ambil Statistik Pesanan (ke Produsen) ---
      const [statsPesanan] = await db.query(`
        SELECT
          COUNT(*) AS totalPesanan,
          SUM(CASE WHEN status = 'Dikirim' THEN 1 ELSE 0 END) AS pengirimanAktif,
          SUM(CASE WHEN status NOT IN ('Selesai', 'Dibatalkan', 'Ditolak') THEN 1 ELSE 0 END) AS pesananBelumSelesai
        FROM pesanan
        WHERE id_pbf = ?
      `, [idPbf]);
      
      // --- 2. Ambil Statistik Stok (dari item yang sudah diterima) ---
      const [statsStok] = await db.query(`
        SELECT 
          SUM(dp.jumlah_pesanan) AS totalStokTersedia
        FROM detail_pesanan dp
        JOIN pesanan p ON dp.id_pesanan = p.id
        WHERE p.id_pbf = ? AND p.status = 'Selesai'
      `, [idPbf]);

      // --- 3. Ambil Stok Obat Terbaru (5 terakhir diterima) ---
      const [stokTerbaru] = await db.query(`
        SELECT 
          pr.batch_id, 
          dp.nama_obat, 
          dp.jumlah_pesanan AS stok, 
          pr.tanggal_kadaluarsa
        FROM detail_pesanan dp
        JOIN pesanan p ON dp.id_pesanan = p.id
        JOIN produksi pr ON dp.id_produksi = pr.id
        WHERE p.id_pbf = ? AND p.status = 'Selesai'
        ORDER BY p.updated_at DESC
        LIMIT 5
      `, [idPbf]);

      // --- 4. Ambil Pesanan Terbaru dari Apotek (Asumsi ada tabel 'pesanan_apotek') ---
      // Ini adalah data dummy karena strukturnya belum ada, tapi siap diintegrasikan
      const pesananTerbaruDariApotek = [
        { id: 1, namaApotek: 'Apotek Sehat Selalu', obat: 'Paracetamol', batchId: 'PCL-001', jumlah: 150, status: 'Dikirim' },
        { id: 2, namaApotek: 'Apotek Waras', obat: 'Amoxicillin', batchId: 'ACL-002', jumlah: 200, status: 'Diterima' },
      ];
      
      const responseData = {
        stats: {
          totalDipesan: statsPesanan[0].totalPesanan || 0,
          pengirimanAktif: statsPesanan[0].pengirimanAktif || 0,
          stokTersedia: statsStok[0].totalStokTersedia || 0,
          pesananBelumSelesai: statsPesanan[0].pesananBelumSelesai || 0,
        },
        stokTerbaru: stokTerbaru,
        pesananTerbaru: pesananTerbaruDariApotek, // Menggunakan data dummy sementara
      };

      res.json({ success: true, data: responseData });

    } catch (error) {
      console.error('Error in getDashboardData:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  }
};

module.exports = dashboardController;