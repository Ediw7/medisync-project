// backend/controllers/pbf/laporanController.js
'use strict';
const db = require('../../config/db');

const LaporanController = {
  // --- LAPORAN UNTUK PRODUSEN ---

  /**
   * @description Mengambil data pemesanan bulanan ke Produsen untuk Bar Chart
   */
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