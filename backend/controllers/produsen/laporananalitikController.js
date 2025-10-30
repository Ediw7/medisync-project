'use strict';

const db = require('../../config/db');


// Fungsi untuk mengambil data analitik
const getAnalyticsData = async (req, res) => {
  let dbConnection;
  try {
    const id_produsen = req.user.id;
    dbConnection = await db.getConnection();

    const [
      produksiResult,
      stokResult,
      pengirimanResult,
      kpiResult,
      penjualanBulananResult,
      topPbfResult,
      rasioPesananResult
    ] = await Promise.all([
      // 1. Produksi Bulanan (6 Bulan Terakhir)
      dbConnection.query(
        `SELECT DATE_FORMAT(tanggal_produksi, '%b %Y') AS bulan, SUM(jumlah) AS total_produksi 
         FROM produksi 
         WHERE id_produsen = ? 
         GROUP BY DATE_FORMAT(tanggal_produksi, '%b %Y') 
         ORDER BY tanggal_produksi DESC 
         LIMIT 6`,
        [id_produsen]
      ),
      // 2. Stok vs Minimum
      dbConnection.query(
        `SELECT 
            p.nama_obat,
            SUM(p.jumlah) AS total_produksi,
            COALESCE(SUM(dp.total_dipesan), 0) AS total_dipesan,
            (SUM(p.jumlah) - COALESCE(SUM(dp.total_dipesan), 0)) AS stok_tersedia
         FROM produksi p
         LEFT JOIN (
            SELECT id_produksi, SUM(jumlah_pesanan) AS total_dipesan
            FROM detail_pesanan
            GROUP BY id_produksi
         ) dp ON p.batch_id = dp.id_produksi
         WHERE p.id_produsen = ?
         AND (p.status = 'Tercatat di Blockchain' OR p.status = 'Selesai')
         GROUP BY p.nama_obat`,
        [id_produsen]
      ),
      // 3. Status Pengiriman (Pipeline Saat Ini)
      Promise.all([
        dbConnection.query("SELECT COUNT(id) as total FROM pesanan WHERE id_produsen = ? AND status = 'Perlu Dikirim'", [id_produsen]),
        dbConnection.query("SELECT COUNT(id) as total FROM pesanan WHERE id_produsen = ? AND status = 'Dikirim'", [id_produsen]),
        dbConnection.query("SELECT COUNT(id) as total FROM pesanan WHERE id_produsen = ? AND status = 'Selesai'", [id_produsen])
      ]),
      // 4. KPI (30 Hari Terakhir)
      Promise.all([
         dbConnection.query("SELECT SUM(total_harga) as total FROM pesanan WHERE id_produsen = ? AND status = 'Selesai' AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", [id_produsen]),
         dbConnection.query("SELECT COUNT(id) as total FROM pesanan WHERE id_produsen = ? AND status = 'Selesai' AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", [id_produsen]),
         dbConnection.query("SELECT COUNT(id) as total FROM pesanan WHERE id_produsen = ? AND status = 'Dikirim'", [id_produsen]),
         dbConnection.query("SELECT COUNT(id) as total FROM pesanan WHERE id_produsen = ? AND status IN ('Dibatalkan', 'Pengembalian Ditolak', 'Pengembalian Selesai') AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", [id_produsen])
      ]),
      // 5. Penjualan Bulanan (6 Bulan Terakhir)
      dbConnection.query(
        `SELECT DATE_FORMAT(updated_at, '%b %Y') AS bulan, SUM(total_harga) AS total_penjualan
         FROM pesanan
         WHERE id_produsen = ? AND status = 'Selesai'
         GROUP BY DATE_FORMAT(updated_at, '%b %Y')
         ORDER BY updated_at DESC
         LIMIT 6`,
        [id_produsen]
      ),
      // 6. Top 5 PBF (All-Time)
      dbConnection.query(
        `SELECT nama_pbf, SUM(total_harga) AS total_pembelian
         FROM pesanan
         WHERE id_produsen = ? AND status = 'Selesai'
         GROUP BY nama_pbf
         ORDER BY total_pembelian DESC
         LIMIT 5`,
        [id_produsen]
      ),
      // 7. Rasio Pesanan Sempurna (All-Time)
      Promise.all([
          dbConnection.query("SELECT COUNT(id) as total FROM pesanan WHERE id_produsen = ? AND status = 'Selesai'", [id_produsen]),
          dbConnection.query("SELECT COUNT(id) as total FROM pesanan WHERE id_produsen = ? AND status IN ('Dibatalkan', 'Pengembalian Ditolak', 'Pengembalian Selesai')", [id_produsen])
      ])
    ]);

    // --- Memproses Hasil Kueri ---

    // 1. Produksi
    const [produksiRows] = produksiResult;
    const produksiLabels = produksiRows.map(row => row.bulan).reverse();
    const produksiData = produksiRows.map(row => row.total_produksi || 0).reverse();

    // 2. Stok
    const [stokRows] = stokResult;
    const stokLabels = stokRows.map(row => row.nama_obat);
    const stokTersedia = stokRows.map(row => parseFloat(row.stok_tersedia) || 0);
    const stokMinimum = stokLabels.map(() => 2000); // Nilai default

    // 3. Pengiriman
    const [[perluDikirimRows], [dalamPengirimanRows], [selesaiRows]] = pengirimanResult;
    const pengirimanChartData = {
      labels: ['Perlu Dikirim', 'Dalam Pengiriman', 'Selesai'],
      datasets: [{
        label: 'Jumlah Pesanan',
        data: [
          perluDikirimRows[0]?.total || 0,
          dalamPengirimanRows[0]?.total || 0,
          selesaiRows[0]?.total || 0
        ],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    };

    // 4. KPI
    const [[penjualan30Hari], [pesanan30Hari], [pesananDikirim], [pesananBermasalah]] = kpiResult;
    const kpiData = {
      totalPenjualan: penjualan30Hari[0]?.total || 0,
      totalPesananSelesai: pesanan30Hari[0]?.total || 0,
      pesananDalamPengiriman: pesananDikirim[0]?.total || 0,
      pesananBermasalah: pesananBermasalah[0]?.total || 0
    };

    // 5. Penjualan Bulanan
    const [penjualanBulananRows] = penjualanBulananResult;
    const penjualanBulananLabels = penjualanBulananRows.map(row => row.bulan).reverse();
    const penjualanBulananData = penjualanBulananRows.map(row => row.total_penjualan || 0).reverse();

    // 6. Top PBF
    const [topPbfRows] = topPbfResult;
    const topPbfLabels = topPbfRows.map(row => row.nama_pbf).reverse();
    const topPbfData = topPbfRows.map(row => row.total_pembelian || 0).reverse();

    // 7. Rasio Pesanan Sempurna
    const [[rasioSelesai], [rasioBermasalah]] = rasioPesananResult;
    const rasioPesananData = {
      labels: ['Pesanan Selesai', 'Pesanan Bermasalah'],
      datasets: [{
        label: 'Jumlah Pesanan',
        data: [
          rasioSelesai[0]?.total || 0,
          rasioBermasalah[0]?.total || 0
        ],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    };

    // --- Mengirim Respons Final ---
    const analyticsData = {
      produksi: {
        labels: produksiLabels,
        datasets: [{
          label: 'Jumlah Produksi (Lokal)',
          data: produksiData,
          borderColor: '#059669',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.1,
        }],
      },
      stok: {
        labels: stokLabels,
        datasets: [{
          label: 'Stok Tersedia (Lokal)',
          data: stokTersedia,
          backgroundColor: '#059669',
          borderRadius: 4,
        }, {
          label: 'Stok Minimum (Target)',
          data: stokMinimum,
          backgroundColor: '#94a3b8',
          borderRadius: 4,
        }],
      },
      pengiriman: pengirimanChartData,
      kpi: kpiData,
      penjualanBulanan: {
        labels: penjualanBulananLabels,
        datasets: [{
            label: 'Total Penjualan (Rp)',
            data: penjualanBulananData,
            backgroundColor: '#059669',
            borderRadius: 4,
        }]
      },
      topPbf: {
        labels: topPbfLabels,
        datasets: [{
            label: 'Total Pembelian (Rp)',
            data: topPbfData,
            backgroundColor: '#059669',
            borderRadius: 4,
        }]
      },
      rasioPesanan: rasioPesananData,
    };

    res.status(200).json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('Error mengambil data analitik:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data analitik: ' + error.message });
  } finally {
    if (dbConnection) dbConnection.release();
  }
};

module.exports = {
  getAnalyticsData,
};