'use strict';

const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Helper function for connecting to the Fabric gateway
async function getGateway() {
  const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const gateway = new Gateway();
  const connectionOptions = {
    wallet,
    identity: 'admin',
    discovery: { enabled: false, asLocalhost: true },
  };
  await gateway.connect(ccp, connectionOptions);
  return gateway;
}

// Function to query all drug assets by produsen ID
async function queryAssetsByProdusen(id_produsen) {
  let gateway;
  try {
    gateway = await getGateway();
    const network = await gateway.getNetwork('medisyncchannel');
    const contract = network.getContract('medisync');
    const result = await contract.evaluateTransaction('ProdusenContract:queryAssetsByProdusen', id_produsen);
    return JSON.parse(result.toString());
  } catch (error) {
    console.error('Error querying blockchain:', error);
    return [];
  } finally {
    if (gateway) gateway.disconnect();
  }
}

// Function to get analytics data
const getAnalyticsData = async (req, res) => {
  let gateway;
  let dbConnection;
  try {
    const id_produsen = req.user.id;
    dbConnection = await db.getConnection();

    // 1. Monthly Production (On-Chain)
    const blockchainAssets = await queryAssetsByProdusen(id_produsen);
    const produksiMap = new Map();
    blockchainAssets.forEach(asset => {
      const date = new Date(asset.tanggalProduksi);
      const bulan = `${date.toLocaleString('id-ID', { month: 'short' })} ${date.getFullYear()}`;
      const jumlah = Number(asset.jumlah) || 0;
      if (produksiMap.has(bulan)) {
        produksiMap.set(bulan, produksiMap.get(bulan) + jumlah);
      } else {
        produksiMap.set(bulan, jumlah);
      }
    });

    const sortedProduksi = Array.from(produksiMap.entries())
      .sort((a, b) => new Date(`01 ${a[0]}`) - new Date(`01 ${b[0]}`))
      .slice(-6);
    const produksiLabels = sortedProduksi.map(([bulan]) => bulan);
    const produksiData = sortedProduksi.map(([_, jumlah]) => jumlah);

    // Fallback to off-chain if blockchain is empty
    if (!produksiLabels.length) {
      const [produksiRows] = await dbConnection.query(
        `SELECT DATE_FORMAT(tanggal_produksi, '%b %Y') AS bulan, SUM(jumlah) AS total_produksi 
         FROM produksi 
         WHERE id_produsen = ? 
         GROUP BY DATE_FORMAT(tanggal_produksi, '%b %Y') 
         ORDER BY tanggal_produksi ASC 
         LIMIT 6`,
        [id_produsen]
      );
      produksiLabels.push(...produksiRows.map(row => row.bulan));
      produksiData.push(...produksiRows.map(row => row.total_produksi || 0));
    }

    // 2. Drug Stock vs Minimum
    const stokMap = new Map();
    blockchainAssets.forEach(asset => {
      if (asset.pemilikSaatIni === 'ProdusenMSP') { 
        const namaObat = asset.namaObat;
        const jumlah = Number(asset.jumlah) || 0;
        if (stokMap.has(namaObat)) {
          stokMap.set(namaObat, stokMap.get(namaObat) + jumlah);
        } else {
          stokMap.set(namaObat, jumlah);
        }
      }
    });

    // Ambil stok dari off-chain jika blockchain kosong
    let stokLabels = stokMap.size ? Array.from(stokMap.keys()) : [];
    let stokTersedia = stokMap.size ? Array.from(stokMap.values()) : [];
    let stokMinimum = [];

    if (!stokLabels.length) {
        const [stokRows] = await dbConnection.query(
            // **FIXED QUERY:** Removed `p.stok_minimum`
            `SELECT p.nama_obat, (p.jumlah - COALESCE(SUM(dp.jumlah_pesanan), 0)) AS stok_tersedia
             FROM produksi p
             LEFT JOIN detail_pesanan dp ON p.id = dp.id_produksi
             WHERE p.id_produsen = ? 
             AND p.status = 'Tercatat di Blockchain'
             GROUP BY p.nama_obat, p.jumlah`,
            [id_produsen]
        );
        stokLabels = stokRows.map(row => row.nama_obat);
        stokTersedia = stokRows.map(row => row.stok_tersedia || 0);
        // **FIXED:** Use a default value of 2000 since the column doesn't exist
        stokMinimum = stokLabels.map(() => 2000); 
    } else {
        // If data is from blockchain, we still need minimum stock data from DB
        const [stokRows] = await dbConnection.query(
            `SELECT p.nama_obat, COALESCE(p.stok_minimum, 2000) AS stok_minimum
             FROM produksi p
             WHERE p.id_produsen = ?
             AND p.status = 'Tercatat di Blockchain'`,
            [id_produsen]
        );
        const stokMinimumMap = new Map();
        stokRows.forEach(row => {
            stokMinimumMap.set(row.nama_obat, row.stok_minimum);
        });
        stokMinimum = stokLabels.map(label => stokMinimumMap.get(label) || 2000);
    }

    // 3. Average Delivery Time (On-Chain)
    let totalDeliveryDays = 0;
    let deliveryCount = 0;
    blockchainAssets.forEach(asset => {
      const dikirimEntry = asset.riwayat.find(entry => entry.status === 'DIKIRIM_KE_PBF');
      const diterimaEntry = asset.riwayat.find(entry => entry.status === 'DITERIMA_PBF');
      if (dikirimEntry && diterimaEntry) {
        const dikirimTime = new Date(dikirimEntry.timestamp);
        const diterimaTime = new Date(diterimaEntry.timestamp);
        const diffDays = (diterimaTime - dikirimTime) / (1000 * 60 * 60 * 24);
        totalDeliveryDays += diffDays;
        deliveryCount++;
      }
    });

    let avgDeliveryDays = deliveryCount > 0 ? totalDeliveryDays / deliveryCount : 0;

    // Fallback to off-chain if no delivery data on blockchain
    if (!deliveryCount) {
      const [deliveryRows] = await dbConnection.query(
        `SELECT AVG(DATEDIFF(sjp.tanggal_pengiriman, p.tanggal_pesanan)) AS avg_delivery_days 
         FROM pesanan p 
         JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan 
         WHERE p.id_produsen = ? 
         AND sjp.status_blockchain = 'Tercatat'`,
        [id_produsen]
      );
      avgDeliveryDays = deliveryRows[0]?.avg_delivery_days || 0;
    }

    // Response data
    const analyticsData = {
      produksi: {
        labels: produksiLabels.length ? produksiLabels : [],
        datasets: [{
          label: 'Jumlah Produksi',
          data: produksiData.length ? produksiData : [],
          borderColor: 'rgb(22, 163, 74)',
          backgroundColor: 'rgba(22, 163, 74, 0.5)',
          tension: 0.4,
        }],
      },
      stok: {
        labels: stokLabels.length ? stokLabels : [],
        datasets: [{
          label: 'Stok Tersedia',
          data: stokTersedia.length ? stokTersedia : [],
          backgroundColor: 'rgba(22, 163, 74, 0.7)',
        }, {
          label: 'Stok Minimum',
          data: stokMinimum.length ? stokMinimum : [],
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
  } finally {
    if (gateway) gateway.disconnect();
    if (dbConnection) dbConnection.release();
  }
};

module.exports = {
  getAnalyticsData,
};