const db = require('../../config/db'); // Sesuaikan path ke konfigurasi database Anda

// Mendapatkan data analitik untuk produsen yang sudah login
const getAnalyticsData = async (req, res) => {
  try {
    const id_produsen = req.user.id;

    // 1. Produksi per Bulan
    const [produksiRows] = await db.query(
      `SELECT DATE_FORMAT(tanggal_produksi, '%b %Y') AS bulan, SUM(jumlah) AS total_produksi 
       FROM produksi 
       WHERE id_produsen = ? 
       GROUP BY DATE_FORMAT(tanggal_produksi, '%b %Y') 
       ORDER BY tanggal_produksi ASC 
       LIMIT 6`, // Batasi ke 6 bulan terakhir untuk kesederhanaan
      [id_produsen]
    );

    const produksiLabels = produksiRows.map(row => row.bulan);
    const produksiData = produksiRows.map(row => row.total_produksi || 0);

    // 2. Stok Obat vs Minimum
    const [stokRows] = await db.query(
      `SELECT nama_obat, jumlah AS stok_tersedia 
       FROM produksi 
       WHERE id_produsen = ? 
       AND status = 'Tercatat di Blockchain' 
       GROUP BY nama_obat`,
      [id_produsen]
    );

    const stokLabels = stokRows.map(row => row.nama_obat);
    const stokTersedia = stokRows.map(row => row.stok_tersedia || 0);
    const stokMinimum = stokLabels.map(() => 2000); // Ambang batas minimum tetap

    // 3. Rata-rata Waktu Pengiriman
    const [deliveryRows] = await db.query(
      `SELECT AVG(DATEDIFF(sjp.tanggal_pengiriman, p.tanggal_pesanan)) AS avg_delivery_days 
       FROM pesanan p 
       JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan 
       WHERE p.id_produsen = ? 
       AND sjp.status_blockchain = 'Tercatat'`,
      [id_produsen]
    );

    const avgDeliveryDays = deliveryRows[0]?.avg_delivery_days || 0;

    // Data respons
    const analyticsData = {
      produksi: {
        labels: produksiLabels,
        datasets: [{
          label: 'Jumlah Produksi',
          data: produksiData,
          borderColor: 'rgb(22, 163, 74)',
          backgroundColor: 'rgba(22, 163, 74, 0.5)',
          tension: 0.4,
        }],
      },
      stok: {
        labels: stokLabels,
        datasets: [{
          label: 'Stok Tersedia',
          data: stokTersedia,
          backgroundColor: 'rgba(22, 163, 74, 0.7)',
        }, {
          label: 'Stok Minimum',
          data: stokMinimum,
          backgroundColor: 'rgba(203, 213, 225, 1)',
        }],
      },
      delivery: {
        avgDeliveryDays,
      },
    };

    res.status(200).json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('Error mengambil data analitik:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data analitik' });
  }
};

// Export dengan module.exports agar tidak undefined
module.exports = {
  getAnalyticsData,
};
