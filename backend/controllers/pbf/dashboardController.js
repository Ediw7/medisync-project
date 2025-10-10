'use strict';
const db = require('../../config/db');

const dashboardController = {
  getDashboardData: async (req, res) => {
    const idPbf = req.user.id;
    try {
      // --- 1. Ambil Statistik Pesanan PBF ke Produsen ---
      const [statsPesananKeProdusen] = await db.query(`
        SELECT COUNT(*) AS totalPesanan
        FROM pesanan
        WHERE id_pbf = ?
      `, [idPbf]);
      
      // --- 2. Logika Perhitungan Stok Tersedia ---
      const [stokMasukRows] = await db.query(`
        SELECT SUM(dp.jumlah_pesanan) AS totalStokMasuk
        FROM detail_pesanan dp
        JOIN pesanan p ON dp.id_pesanan = p.id
        WHERE p.id_pbf = ? AND p.status = 'Selesai'
      `, [idPbf]);
      const totalStokMasuk = stokMasukRows[0].totalStokMasuk || 0;

      const [stokKeluarRows] = await db.query(`
        SELECT SUM(dpa.jumlah) AS totalStokKeluar
        FROM detail_pesanan_apotek dpa
        JOIN pesanan_apotek pa ON dpa.id_pesanan_apotek = pa.id
        WHERE pa.id_pbf = ? AND pa.status IN ('Dikirim', 'Selesai')
      `, [idPbf]);
      const totalStokKeluar = stokKeluarRows[0].totalStokKeluar || 0;
      
      const stokTersedia = totalStokMasuk - totalStokKeluar;

      // --- 3. Hitung Pesanan dari Apotek yang Belum Selesai ---
      const [pesananApotekBelumSelesaiRows] = await db.query(`
        SELECT COUNT(*) AS totalBelumSelesai
        FROM pesanan_apotek
        WHERE id_pbf = ? AND status NOT IN ('Selesai', 'Dibatalkan')
      `, [idPbf]);

      // --- 4. Ambil Stok Obat Terbaru (5 terakhir diterima dari produsen) ---
      const [stokTerbaru] = await db.query(`
        SELECT 
          dp.id_aset_blockchain as batch_id, 
          dp.nama_obat, 
          dp.jumlah_pesanan AS stok, 
          (SELECT tanggal_kadaluarsa FROM produksi pr WHERE pr.id = dp.id_produksi) as tanggal_kadaluarsa
        FROM detail_pesanan dp
        JOIN pesanan p ON dp.id_pesanan = p.id
        WHERE p.id_pbf = ? AND p.status = 'Selesai'
        ORDER BY p.updated_at DESC
        LIMIT 5
      `, [idPbf]);

      // --- 5. Ambil Pesanan Terbaru dari Apotek ---
      const [pesananMasukTerbaruRows] = await db.query(`
        SELECT 
            pa.id,
            pa.nama_apotek as namaApotek, -- Menggunakan alias agar konsisten
            pa.status,
            pa.tanggal_pesanan,
            (SELECT GROUP_CONCAT(dpa.nama_obat SEPARATOR ', ') FROM detail_pesanan_apotek dpa WHERE dpa.id_pesanan_apotek = pa.id) as obat,
            (SELECT SUM(dpa.jumlah) FROM detail_pesanan_apotek dpa WHERE dpa.id_pesanan_apotek = pa.id) as jumlah
        FROM pesanan_apotek pa
        WHERE pa.id_pbf = ?
        ORDER BY pa.tanggal_pesanan DESC
        LIMIT 5
      `, [idPbf]);
      
      // --- 6. DIUBAH: Susun objek respons dengan benar ---
      const responseData = {
        stats: {
          totalDipesan: statsPesananKeProdusen[0].totalPesanan || 0,
          pengirimanAktif: 0, // Placeholder
          stokTersedia: stokTersedia,
          pesananBelumSelesai: pesananApotekBelumSelesaiRows[0].totalBelumSelesai || 0, 
        },
        stokTerbaru: stokTerbaru,
        // Mengirim data detail pesanan, bukan hanya jumlahnya
        pesananTerbaru: pesananMasukTerbaruRows, 
      };

      res.json({ success: true, data: responseData });

    } catch (error) {
      console.error('Error in getDashboardData PBF:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  }
};

module.exports = dashboardController;