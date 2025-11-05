'use strict';
const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// --- Fungsi Koneksi Gateway (khusus Apotek) ---
async function getApotekGateway() {
  try {
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get('apotekAdmin');
    if (!identity) {
      throw new Error('Identitas "apotekAdmin" tidak ditemukan di wallet.');
    }
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org3.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'apotekAdmin',
      discovery: { enabled: true, asLocalhost: true }
    });
    return gateway;
  } catch (error) {
    console.error('Error initializing Apotek gateway:', error);
    throw new Error(`Gagal koneksi ke blockchain: ${error.message}`);
  }
}

const laporanApotekController = {

  /**
   * GET /api/apotek/laporan/analytics
   * Mengambil semua data untuk dashboard analitik Apotek.
   */
  getAnalyticsData: async (req, res) => {
    const idApotek = req.user.id;
    let dbConnection;
    let gateway;

    try {
      dbConnection = await db.getConnection();
      gateway = await getApotekGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');
      
      // --- 1. Total Penjualan (ke Konsumen) 6 Bulan Terakhir ---
      const [penjualanData] = await dbConnection.query(
        `SELECT 
           DATE_FORMAT(tanggal_penjualan, '%Y-%m') AS bulan,
           SUM(total_harga) AS total
         FROM penjualan
         WHERE id_apotek = ? AND tanggal_penjualan >= CURDATE() - INTERVAL 6 MONTH
         GROUP BY bulan
         ORDER BY bulan ASC`,
        [idApotek]
      );
      
      // Format untuk Chart.js
      const totalPenjualanChart = {
          labels: penjualanData.map(d => d.bulan),
          data: penjualanData.map(d => d.total)
      };

      // --- 2. Obat Terlaris (ke Konsumen) Top 5 ---
      const [obatTerlaris] = await dbConnection.query(
        `SELECT 
           dp.nama_obat, 
           SUM(dp.jumlah_jual) AS total_terjual
         FROM detail_penjualan dp
         JOIN penjualan p ON dp.id_penjualan = p.id
         WHERE p.id_apotek = ?
         GROUP BY dp.nama_obat
         ORDER BY total_terjual DESC
         LIMIT 5`,
        [idApotek]
      );
      
      const obatTerlarisChart = {
          labels: obatTerlaris.map(d => d.nama_obat),
          data: obatTerlaris.map(d => d.total_terjual)
      };
      
      // --- 3. Total Pembelian (dari PBF) 6 Bulan Terakhir ---
      const [pembelianData] = await dbConnection.query(
        `SELECT
           DATE_FORMAT(tanggal_pesanan, '%Y-%m') AS bulan,
           SUM(total_harga) AS total
         FROM pesanan_apotek
         WHERE id_apotek = ? AND status = 'Selesai' AND tanggal_pesanan >= CURDATE() - INTERVAL 6 MONTH
         GROUP BY bulan
         ORDER BY bulan ASC`,
         [idApotek]
      );
      
      const totalPembelianChart = {
          labels: pembelianData.map(d => d.bulan),
          data: pembelianData.map(d => d.total)
      };

      // --- 4. Stok & Kadaluwarsa (dari Blockchain) ---
      const resultBytes = await contract.evaluateTransaction('ApotekContract:queryStokApotek');
      const stokBlockchain = JSON.parse(resultBytes.toString());
      
      const hampirKadaluwarsaList = [];
      const now = new Date();
      // Batas waktu 3 bulan (90 hari)
      const warningLimit = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()); 

      stokBlockchain.forEach(item => {
          const tglKadaluarsa = new Date(item.tanggalKadaluarsa);
          
          if (tglKadaluarsa <= warningLimit) {
              const timeDiff = tglKadaluarsa.getTime() - now.getTime();
              const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
              
              hampirKadaluwarsaList.push({
                  nama: item.namaObat, // Sesuaikan dengan key 'namaObat' dari chaincode
                  batchId: item.id.slice(-12), // Tampilkan 12 karakter terakhir
                  stok: item.jumlah,
                  tanggal: item.tanggalKadaluarsa,
                  status: daysLeft <= 0 ? 'Kadaluwarsa' : `${daysLeft} hari lagi`
              });
          }
      });
      
      // Urutkan berdasarkan tanggal kadaluwarsa terdekat
      hampirKadaluwarsaList.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

      res.json({
          success: true,
          data: {
              totalPenjualanChart,
              obatTerlarisChart,
              totalPembelianChart,
              hampirKadaluwarsaData: hampirKadaluwarsaList.slice(0, 5) // Ambil 5 teratas
          }
      });

    } catch (error) {
      console.error('Error getAnalyticsData (Apotek):', error);
      res.status(500).json({ success: false, message: `Gagal mengambil data analitik: ${error.message}` });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  }
};

module.exports = laporanApotekController;