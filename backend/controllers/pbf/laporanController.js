// backend/controllers/pbf/laporanController.js
'use strict';
const db = require('../../config/db');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);

async function getStokGudangFromCouchDB(idPbf) {
  try {
    const dbName = process.env.COUCHDB_DB || 'medisyncchannel_medisync';
    const dbInstance = nano.use(dbName);
    
    // Query CouchDB untuk aset yang dimiliki oleh PBFMSP
    // Asumsi: idPbf yang login di SQL = PBFMSP di CouchDB
    const result = await dbInstance.find({
      selector: {
        docType: 'obat',
        pemilikSaatIni: 'PBFMSP' // Mengambil semua stok yang dimiliki PBF
      },
      fields: ['jumlah'] // Kita hanya perlu field 'jumlah'
    });

    // Jumlahkan total 'jumlah' dari semua dokumen yang ditemukan
    const totalStok = result.docs.reduce((sum, doc) => sum + (Number(doc.jumlah) || 0), 0);
    return totalStok;

  } catch (error) {
    console.error('Error fetching stok from CouchDB:', error.message);
    // Kembalikan 0 jika CouchDB error agar tidak crash
    return 0; 
  }
}

// (Tambahkan ini di dekat bagian atas file)

// Helper untuk mengambil Top 10 Produk Terlaris ke Apotek (by Revenue)
async function _getProdukTerlaris(idPbf, connection) {
  const sql = `
    SELECT 
      dpa.nama_obat, 
      SUM(dpa.jumlah) as total_terjual, 
      SUM(dpa.jumlah * dpa.harga_satuan) as total_pendapatan
    FROM detail_pesanan_apotek dpa
    JOIN pesanan_apotek pa ON dpa.id_pesanan_apotek = pa.id
    WHERE pa.id_pbf = ? AND pa.status = 'Selesai'
    GROUP BY dpa.nama_obat
    ORDER BY total_pendapatan DESC
    LIMIT 10
  `;
  const [rows] = await connection.query(sql, [idPbf]);
  return rows;
}

// Helper untuk mengambil Top 10 Apotek (by Revenue)
async function _getTopApotekRevenue(idPbf, connection) {
  const sql = `
    SELECT 
      u.nama_resmi AS nama_apotek, 
      SUM(p.total_harga) AS total_penjualan
    FROM pesanan_apotek p
    JOIN users u ON p.id_apotek = u.id
    WHERE p.id_pbf = ? AND p.status = 'Selesai' AND u.role = 'apotek'
    GROUP BY u.nama_resmi
    ORDER BY total_penjualan DESC
    LIMIT 10
  `;
  const [rows] = await connection.query(sql, [idPbf]);
  return rows;
}

const LaporanController = {
  
   getKpiData: async (req, res) => {
    const idPbf = req.user.id;
    let connection;
    try {
      connection = await db.getConnection();

      // 1. Total Pembelian (dari Produsen, status Selesai atau Pengembalian Selesai)
      const [pembelianRows] = await connection.query(
        "SELECT SUM(total_harga) as totalPembelian FROM pesanan WHERE id_pbf = ? AND (status = 'Selesai' OR status = 'Pengembalian Selesai')",
        [idPbf]
      );

      // 2. Total Pesanan Selesai (dari Produsen) - SESUAI PERMINTAAN
      const [pesananRows] = await connection.query(
        "SELECT COUNT(id) as totalPesananProdusenSelesai FROM pesanan WHERE id_pbf = ? AND (status = 'Selesai' OR status = 'Pengembalian Selesai')",
        [idPbf]
      );

      // 3. Total Stok Gudang (diambil dari CouchDB) - SESUAI PERMINTAAN
      const totalStokGudang = await getStokGudangFromCouchDB(idPbf);

      res.json({
        success: true,
        data: {
          totalPembelian: pembelianRows[0].totalPembelian || 0,
          totalPesananProdusenSelesai: pesananRows[0].totalPesananProdusenSelesai || 0,
          totalStokGudang: totalStokGudang || 0,
        }
      });

    } catch (error) {
      console.error('Error in getKpiData:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    } finally {
      if (connection) connection.release();
    }
  },
  
  getPemesananBulananProdusen: async (req, res) => {
    const idPbf = req.user.id;
    const { filter } = req.query; // '12bulan' or '6bulan'

    try {
      let sql, labels = [], data = [];

      if (filter === '6bulan') {
        // --- LOGIKA BARU: 6 BULAN TERAKHIR ---
        sql = `
          SELECT 
            DATE_FORMAT(p.tanggal_pesanan, '%Y-%m') AS bulan_key, 
            SUM(dp.jumlah_pesanan) AS total_jumlah
          FROM pesanan p
          JOIN detail_pesanan dp ON p.id = dp.id_pesanan
          WHERE 
            p.id_pbf = ? 
            AND p.status = 'Selesai'
            AND p.tanggal_pesanan >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          GROUP BY DATE_FORMAT(p.tanggal_pesanan, '%Y-%m')
          ORDER BY bulan_key ASC
        `;
        const [rows] = await db.query(sql, [idPbf]);
        
        // Buat map data dari hasil query
        const dataMap = new Map();
        rows.forEach(r => dataMap.set(r.bulan_key, Number(r.total_jumlah) || 0));

        // Buat labels 6 bulan terakhir (Contoh: Mei, Jun, Jul, Ags, Sep, Okt)
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const label = d.toLocaleString('id-ID', { month: 'short' }); // 'Okt'
            const key = d.toISOString().slice(0, 7); // '2025-10'
            
            labels.push(label);
            data.push(dataMap.get(key) || 0);
        }

      } else {
        // --- LOGIKA BARU: TAHUN INI (12 BULAN) ---
        // (Ini adalah logika 'bulanan' Anda sebelumnya)
        sql = `
          SELECT 
            MONTH(p.tanggal_pesanan) AS bulan, 
            SUM(dp.jumlah_pesanan) AS total_jumlah
          FROM pesanan p
          JOIN detail_pesanan dp ON p.id = dp.id_pesanan
          WHERE 
            p.id_pbf = ? 
            AND p.status = 'Selesai' 
            AND YEAR(p.tanggal_pesanan) = YEAR(CURDATE())
          GROUP BY MONTH(p.tanggal_pesanan)
          ORDER BY bulan ASC
        `;
        const [rows] = await db.query(sql, [idPbf]);
        
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        data = new Array(12).fill(0);
        rows.forEach(row => {
          data[row.bulan - 1] = Number(row.total_jumlah) || 0;
        });
      }

      res.json({ success: true, labels, data });

    } catch (error) {
      console.error('Error in getPemesananBulananProdusen:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  /**
   * @description Mengambil data transaksi per produsen untuk Pie Chart
   */
  getTransaksiPerProdusen: async (req, res) => {
    const idPbf = req.user.id;
    try {
      const sql = `
        SELECT 
          u.nama_resmi AS nama_produsen, 
          COUNT(p.id) AS jumlah_transaksi
        FROM pesanan p
        JOIN users u ON p.id_produsen = u.id
        WHERE p.id_pbf = ? AND u.role = 'produsen'
        GROUP BY u.nama_resmi
        ORDER BY jumlah_transaksi DESC
      `;
      const [rows] = await db.query(sql, [idPbf]);

      const labels = rows.map(r => r.nama_produsen);
      const data = rows.map(r => r.jumlah_transaksi);

      res.json({ success: true, labels, data });
    } catch (error) {
      console.error('Error in getTransaksiPerProdusen:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  /**
   * @description Mengambil riwayat transaksi terbaru dengan produsen untuk Tabel
   */
  getRiwayatProdusen: async (req, res) => {
    const idPbf = req.user.id;
    try {
      const sql = `
        SELECT 
          p.id, 
          p.nomor_po, 
          p.tanggal_pesanan, 
          u.nama_resmi AS nama_produsen, 
          (SELECT SUM(dp.jumlah_pesanan) FROM detail_pesanan dp WHERE dp.id_pesanan = p.id) AS jumlah_item, 
          p.status
        FROM pesanan p
        JOIN users u ON p.id_produsen = u.id
        WHERE p.id_pbf = ? AND u.role = 'produsen'
        ORDER BY p.tanggal_pesanan DESC
        LIMIT 10
      `;
      const [rows] = await db.query(sql, [idPbf]);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getRiwayatProdusen:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // --- LAPORAN UNTUK APOTEK ---

  /**
   * @description Mengambil data distribusi bulanan ke Apotek untuk Bar Chart
   */

  

  // ... (fungsi controller lainnya)
// (Pastikan Anda sudah menambahkan _getProdukTerlaris dan _getTopApotekRevenue di atas controller ini)

// ... (fungsi Anda yang lain seperti getKpiData, getPemesananBulananProdusen, dll.)

  getLaporanApotekAgregat: async (req, res) => {
  const idPbf = req.user.id;
  let connection;
  try {
    connection = await db.getConnection();

    // Ambil 12 bulan terakhir dari sekarang
    const endDate = new Date();
    // Perbaikan kecil: Pastikan startDate menghitung mundur 11 bulan, BUKAN 12
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    };

    // Buat array 12 bulan
    const months = [];
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      months.push(formatDate(new Date(d)));
    }

    // --- QUERY SQL YANG BENAR (BUKAN '...') ---
    const sqlDistribusi = `
      SELECT 
        DATE_FORMAT(p.tanggal_pesanan, '%Y-%m') AS bulan, 
        SUM(d.jumlah) AS jumlah 
      FROM pesanan_apotek p
      JOIN detail_pesanan_apotek d ON p.id = d.id_pesanan_apotek
      WHERE p.id_pbf = ? AND p.status = 'Selesai'
        AND p.tanggal_pesanan >= ?
        AND p.tanggal_pesanan <= LAST_DAY(?)
      GROUP BY DATE_FORMAT(p.tanggal_pesanan, '%Y-%m')
    `;

    const sqlPengiriman = `
      SELECT 
        DATE_FORMAT(tanggal_pesanan, '%Y-%m') AS bulan, 
        COUNT(id) AS jumlah 
      FROM pesanan_apotek 
      WHERE id_pbf = ? AND status = 'Selesai'
        AND tanggal_pesanan >= ?
        AND tanggal_pesanan <= LAST_DAY(?)
      GROUP BY DATE_FORMAT(tanggal_pesanan, '%Y-%m')
    `;

    const sqlPenjualan = `
      SELECT 
        DATE_FORMAT(tanggal_pesanan, '%Y-%m') AS bulan, 
        SUM(total_harga) AS total 
      FROM pesanan_apotek 
      WHERE id_pbf = ? AND status = 'Selesai'
        AND tanggal_pesanan >= ?
        AND tanggal_pesanan <= LAST_DAY(?)
      GROUP BY DATE_FORMAT(tanggal_pesanan, '%Y-%m')
    `;
    // --- AKHIR QUERY SQL YANG BENAR ---

    // Jalankan semua query secara paralel
    const [
      [distribusiRows],
      [pengirimanRows],
      [penjualanRows],
      produkTerlaris,
      topApotekRevenue
    ] = await Promise.all([
      connection.query(sqlDistribusi, [idPbf, startDate, endDate]),
      connection.query(sqlPengiriman, [idPbf, startDate, endDate]),
      connection.query(sqlPenjualan, [idPbf, startDate, endDate]),
      _getProdukTerlaris(idPbf, connection), // Panggil helper baru
      _getTopApotekRevenue(idPbf, connection) // Panggil helper baru
    ]);

    // Map ke objek untuk lookup cepat
    const mapRows = (rows) => {
      const map = {};
      rows.forEach(r => { map[r.bulan] = r.jumlah || r.total || 0; });
      return map;
    };

    const distribusiMap = mapRows(distribusiRows);
    const pengirimanMap = mapRows(pengirimanRows);
    const penjualanMap = mapRows(penjualanRows);

    // Isi data lengkap 12 bulan
    const distribusiObat = months.map(m => ({ bulan: m, jumlah: Number(distribusiMap[m]) || 0 }));
    const jumlahPengiriman = months.map(m => ({ bulan: m, jumlah: Number(pengirimanMap[m]) || 0 }));
    const hasilPenjualan = months.map(m => ({ bulan: m, total: Number(penjualanMap[m]) || 0 }));

    res.json({
      success: true,
      data: { 
        distribusiObat, 
        jumlahPengiriman, 
        hasilPenjualan,
        produkTerlaris,    // <-- Data baru
        topApotekRevenue   // <-- Data baru
      }
    });

  } catch (error) {
    console.error('Error in getLaporanApotekAgregat:', error);
    res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
  } finally {
    if (connection) connection.release();
  }
},
// ... (sisa controller Anda)
  getDistribusiBulananApotek: async (req, res) => {
    const idPbf = req.user.id;
    try {
      const sql = `
        SELECT 
          MONTH(tanggal_pesanan) AS bulan, 
          COUNT(id) AS jumlah_pesanan
        FROM pesanan_apotek
        WHERE id_pbf = ? AND YEAR(tanggal_pesanan) = YEAR(CURDATE())
        GROUP BY MONTH(tanggal_pesanan)
        ORDER BY bulan ASC
      `;
      const [rows] = await db.query(sql, [idPbf]);

      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const data = new Array(12).fill(0);
      rows.forEach(row => {
        data[row.bulan - 1] = row.jumlah_pesanan;
      });

      res.json({ success: true, labels, data });
    } catch (error) {
      console.error('Error in getDistribusiBulananApotek:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  /**
   * @description Mengambil data transaksi per apotek untuk Pie Chart
   */
  getTransaksiPerApotek: async (req, res) => {
    const idPbf = req.user.id;
    try {
      const sql = `
        SELECT 
          u.nama_resmi AS nama_apotek, 
          COUNT(p.id) AS jumlah_transaksi
        FROM pesanan_apotek p
        JOIN users u ON p.id_apotek = u.id
        WHERE p.id_pbf = ? AND u.role = 'apotek'
        GROUP BY u.nama_resmi
        ORDER BY jumlah_transaksi DESC
      `;
      const [rows] = await db.query(sql, [idPbf]);

      const labels = rows.map(r => r.nama_apotek);
      const data = rows.map(r => r.jumlah_transaksi);

      res.json({ success: true, labels, data });
    } catch (error) {
      console.error('Error in getTransaksiPerApotek:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  /**
   * @description Mengambil riwayat transaksi terbaru dengan apotek untuk Tabel
   */
  getRiwayatApotek: async (req, res) => {
    const idPbf = req.user.id;
    try {
      const sql = `
        SELECT 
          p.id, 
          p.nomor_pesanan, 
          p.tanggal_pesanan, 
          u.nama_resmi AS nama_apotek, 
          (SELECT SUM(dp.jumlah_pesanan) FROM detail_pesanan_apotek dp WHERE dp.id_pesanan_apotek = p.id) AS jumlah_item, 
          p.status
        FROM pesanan_apotek p
        JOIN users u ON p.id_apotek = u.id
        WHERE p.id_pbf = ? AND u.role = 'apotek'
        ORDER BY p.tanggal_pesanan DESC
        LIMIT 10
      `;
      const [rows] = await db.query(sql, [idPbf]);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getRiwayatApotek:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },
};

module.exports = LaporanController;