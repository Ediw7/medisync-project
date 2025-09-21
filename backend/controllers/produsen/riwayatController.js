'use strict';
const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Fungsi helper untuk koneksi ke gateway sebagai admin Produsen
async function getGateway() {
  const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  
  // Pastikan identitas admin produsen ada
  const identity = await wallet.get('admin');
  if (!identity) {
      throw new Error('Identitas "admin" (Produsen) tidak ditemukan di wallet. Jalankan enrollAdmin.js terlebih dahulu.');
  }

  const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: 'admin', // Menggunakan identitas admin Produsen
    discovery: { enabled: true, asLocalhost: true }
  });
  return gateway;
}

const riwayatController = {
  // Di dalam file: backend/controllers/produsen/riwayatController.js

getRiwayatByAssetId: async (req, res) => {
    const { assetId } = req.params;
    let gateway;
    try {
      // 1. Ambil data On-Chain (dari Blockchain)
      gateway = await getGateway(); // Asumsikan getGateway() sudah didefinisikan di file ini
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');
      
      console.log(`Querying blockchain for asset: ${assetId}`);
      const resultBuffer = await contract.evaluateTransaction('readObat', assetId);
      const onChainData = JSON.parse(resultBuffer.toString());

      const idPesanan = onChainData.id.substring(onChainData.id.lastIndexOf('-') + 1);

      // 2. Ambil data Off-Chain (dari MySQL)
      const sql = `
        SELECT 
          p.id, p.nomor_po, p.status, p.tanggal_pesanan,
          sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman,
          pbf.nama_resmi as nama_pbf,
          produsen.nama_resmi as nama_produsen, -- PERBAIKAN: Menggunakan alias 'produsen' yang benar
          p.bukti_foto as buktiPenerimaUrl
        FROM pesanan p
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        JOIN users pbf ON p.id_pbf = pbf.id
        JOIN users produsen ON p.id_produsen = produsen.id
        WHERE p.id = ?
      `;
      const [offChainRows] = await db.query(sql, [idPesanan]);

      if (offChainRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data pesanan off-chain tidak ditemukan.' });
      }

      // 3. Gabungkan data dan kirim sebagai respons
      const responseData = {
        onChain: onChainData,
        offChain: offChainRows[0]
      };

      res.json({ success: true, data: responseData });

    } catch (error) {
      console.error(`Error fetching riwayat for asset ${assetId}:`, error);
      res.status(500).json({ success: false, message: `Gagal mengambil data riwayat: ${error.message}` });
    } finally {
      if (gateway) {
        gateway.disconnect();
      }
    }
  }
};

module.exports = riwayatController;