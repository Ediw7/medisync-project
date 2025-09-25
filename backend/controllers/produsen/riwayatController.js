'use strict';
const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// 🔹 Helper koneksi ke Gateway sebagai admin Produsen
async function getGateway() {
  const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const identity = await wallet.get('admin');
  if (!identity) {
    throw new Error('Identitas "admin" (Produsen) tidak ditemukan di wallet. Jalankan enrollAdmin.js terlebih dahulu.');
  }

  const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: 'admin',
    discovery: { enabled: true, asLocalhost: true }
  });

  return gateway;
}

const riwayatController = {
  // 🔹 Ambil semua riwayat distribusi (off-chain)
  getAllRiwayat: async (req, res) => {
  const idProdusen = req.user.id;
  let gateway;
  try {
    // 1. Ambil data Off-Chain (MySQL)
    const sql = `
      SELECT
        p.id, p.nomor_po, p.status, p.tanggal_pesanan,
        sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman,
        sjp.opsi_pengiriman,
        pbf.nama_resmi AS nama_pbf,
        produsen.nama_resmi AS nama_produsen,
        p.bukti_foto AS buktiPenerimaUrl,
        SUM(dp.jumlah_pesanan) AS jumlah_total_obat,
        dp.id_aset_blockchain
      FROM pesanan p
      LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
      JOIN users pbf ON p.id_pbf = pbf.id
      JOIN users produsen ON p.id_produsen = produsen.id
      LEFT JOIN detail_pesanan dp ON p.id = dp.id_pesanan
      WHERE p.id_produsen = ?
      GROUP BY p.id, p.nomor_po, p.status, p.tanggal_pesanan,
        sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman,
        pbf.nama_resmi, produsen.nama_resmi, p.bukti_foto, dp.id_aset_blockchain
      ORDER BY p.tanggal_pesanan DESC
    `;
    const [rows] = await db.query(sql, [idProdusen]);

    // 2. Ambil data On-Chain untuk setiap id_aset_blockchain
    gateway = await getGateway();
    const network = await gateway.getNetwork('medisyncchannel');
    const contract = network.getContract('medisync');

    const enrichedRows = await Promise.all(
      rows.map(async (item) => {
        let onChainData = null;
        if (item.id_aset_blockchain) {
          try {
            const resultBuffer = await contract.evaluateTransaction('readObat', item.id_aset_blockchain);
            onChainData = JSON.parse(resultBuffer.toString());
          } catch (err) {
            console.warn(`Asset ${item.id_aset_blockchain} tidak ditemukan di blockchain.`);
          }
        }
        return {
          ...item,
          jumlah_total_obat: onChainData?.jumlah || item.jumlah_total_obat || 0,
          status_blockchain: onChainData?.statusSaatIni || item.status,
        };
      })
    );

    return res.json({ success: true, data: enrichedRows });
  } catch (error) {
    console.error('Error getAllRiwayat:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar riwayat distribusi',
      error: error.message,
    });
  } finally {
    if (gateway) gateway.disconnect();
  }
},
  // 🔹 Ambil detail riwayat (on-chain + off-chain)
  getRiwayatByAssetId: async (req, res) => {
    const { assetId } = req.params;
    let gateway;

    try {
      // 1. Ambil data On-Chain (Blockchain)
      gateway = await getGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      let onChainData = null;
      try {
        const resultBuffer = await contract.evaluateTransaction('readObat', assetId);
        onChainData = JSON.parse(resultBuffer.toString());
      } catch (err) {
        console.warn(`Asset ${assetId} tidak ditemukan di blockchain.`);
      }

      // Cari idPesanan dari on-chain
      let idPesanan = null;
      if (onChainData?.id) {
        idPesanan = onChainData.id.substring(onChainData.id.lastIndexOf('-') + 1);
      }

      // 2. Ambil data Off-Chain (MySQL)
      let offChainRows = [];
      if (idPesanan) {
        const sql = `
          SELECT 
            p.id, p.nomor_po, p.status, p.tanggal_pesanan,
            sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman,
            pbf.nama_resmi AS nama_pbf,
            produsen.nama_resmi AS nama_produsen,
            p.bukti_foto AS buktiPenerimaUrl
          FROM pesanan p
          LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
          JOIN users pbf ON p.id_pbf = pbf.id
          JOIN users produsen ON p.id_produsen = produsen.id
          WHERE p.id = ?
        `;
        const [rows] = await db.query(sql, [idPesanan]);
        offChainRows = rows;
      }

      if (!onChainData && offChainRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data riwayat tidak ditemukan.' });
      }

      // 3. Gabungkan hasil
      return res.json({
        success: true,
        data: {
          onChain: onChainData || null,
          offChain: offChainRows[0] || null,
          isSynced: !!(onChainData && offChainRows.length > 0)
        }
      });

    } catch (error) {
      console.error(`Error fetching riwayat for asset ${assetId}:`, error);
      return res.status(500).json({
        success: false,
        message: `Gagal mengambil data riwayat: ${error.message}`
      });
    } finally {
      if (gateway) gateway.disconnect();
    }
  }
};

module.exports = riwayatController;
