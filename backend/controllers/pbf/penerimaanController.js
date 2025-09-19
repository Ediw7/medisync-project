'use strict';

const db = require('../../config/db');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Gateway, Wallets } = require('fabric-network');
const grpc = require('@grpc/grpc-js');

// Fungsi untuk menghitung hash file
async function calculateFileHash(filePath) {
  try {
    console.log(`Calculating hash for file: ${filePath}`);
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    const fileHash = hash.digest('hex');
    console.log(`File hash calculated: ${fileHash}`);
    return fileHash;
  } catch (error) {
    console.error('Error calculating file hash:', error);
    throw new Error(`Gagal menghitung hash file: ${error.message}`);
  }
}

// Fungsi untuk membuat koneksi ke Hyperledger Fabric
async function getGateway() {
  try {
    console.log('Initializing Fabric Gateway connection...');
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json');
    console.log(`Loading connection profile from: ${ccpPath}`);
    if (!await fs.access(ccpPath).then(() => true).catch(() => false)) {
      throw new Error(`Connection profile not found at: ${ccpPath}`);
    }
    const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

    const certPath = path.resolve(__dirname, '..', '..', 'wallet', 'pbf-user', 'signcerts', 'cert.pem');
    const keyPath = path.resolve(__dirname, '..', '..', 'wallet', 'pbf-user', 'keystore', 'key.pem');
    console.log(`Loading cert from: ${certPath}, key from: ${keyPath}`);
    if (!await fs.access(certPath).then(() => true).catch(() => false)) {
      throw new Error(`Certificate not found at: ${certPath}`);
    }
    if (!await fs.access(keyPath).then(() => true).catch(() => false)) {
      throw new Error(`Private key not found at: ${keyPath}`);
    }
    const cert = await fs.readFile(certPath);
    const key = await fs.readFile(keyPath);

    const tlsCaCertPath = path.resolve(__dirname, '..', '..', 'organizations', 'peerOrganizations', 'org2.medisync.com', 'tlsca', 'tlsca.org2.medisync.com-cert.pem');
    console.log(`Loading TLS CA cert from: ${tlsCaCertPath}`);
    if (!await fs.access(tlsCaCertPath).then(() => true).catch(() => false)) {
      throw new Error(`TLS CA certificate not found at: ${tlsCaCertPath}`);
    }
    const tlsCaCert = await fs.readFile(tlsCaCertPath);

    const wallet = await Wallets.newInMemoryWallet();
    const identity = {
      credentials: {
        certificate: cert,
        privateKey: key,
      },
      mspId: 'PBFMSP',
      type: 'X.509',
    };
    await wallet.put('pbf-user', identity);

    const client = new grpc.Client(
      'localhost:9051',
      grpc.credentials.createSsl(tlsCaCert),
      { 'grpc.ssl_target_name_override': 'peer0.org2.medisync.com' }
    );

    const gateway = new Gateway();
    await gateway.connect(client, {
      wallet,
      identity: 'pbf-user',
      discovery: { enabled: true, asLocalhost: true },
    });

    console.log('Gateway connection established');
    return gateway;
  } catch (error) {
    console.error('Error initializing gateway:', error);
    throw new Error(`Gagal menginisialisasi koneksi ke blockchain: ${error.message}`);
  }
}

const penerimaanController = {
  // Mengonfirmasi penerimaan pesanan dengan unggah foto
  confirmPenerimaan: async (req, res) => {
    const { id } = req.params;
    const idPbf = req.user.id;
    const buktiFoto = req.file;

    let gateway;
    let dbConnection;

    try {
      if (!buktiFoto) {
        return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
      }

      console.log(`Processing penerimaan for pesanan ID: ${id}, PBF ID: ${idPbf}, File: ${buktiFoto.path}`);

      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      const [pesanan] = await dbConnection.query(
        'SELECT id, status FROM pesanan WHERE id = ? AND id_pbf = ?',
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
      }

      if (pesanan[0].status !== 'Dikirim') {
        return res.status(400).json({
          success: false,
          message: 'Pesanan hanya dapat dikonfirmasi jika statusnya "Dikirim".',
        });
      }

      // Pastikan file ada
      if (!await fs.access(buktiFoto.path).then(() => true).catch(() => false)) {
        throw new Error('File bukti foto tidak ditemukan di server.');
      }

      const hashBuktiFoto = await calculateFileHash(buktiFoto.path);
      console.log(`Hash bukti foto: ${hashBuktiFoto}`);

      // Koneksi ke Fabric
      gateway = await getGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      // Ambil detail pesanan untuk mendapatkan batch_id
      const [detailPesanan] = await dbConnection.query(
        'SELECT pr.batch_id FROM detail_pesanan dp JOIN produksi pr ON dp.id_produksi = pr.id WHERE dp.id_pesanan = ?',
        [id]
      );

      if (detailPesanan.length === 0) {
        throw new Error('Detail pesanan tidak ditemukan.');
      }

      // Panggil chaincode terimaBarang untuk setiap item
      for (const item of detailPesanan) {
        console.log(`Submitting transaction for batch_id: ${item.batch_id}`);
        const transaction = contract.createTransaction('PbfContract:terimaBarang');
        transaction.setEndorsingOrganizations('PBFMSP');
        await transaction.submit(item.batch_id, hashBuktiFoto);
        console.log(`Transaction for batch_id: ${item.batch_id} submitted successfully`);
      }

      // Update status pesanan di MySQL
      await dbConnection.query(
        'UPDATE pesanan SET status = ?, bukti_foto = ?, catatan_khusus = ? WHERE id = ?',
        ['Selesai', buktiFoto.path, `Bukti penerimaan: ${buktiFoto.path}, Hash: ${hashBuktiFoto}`, id]
      );

      await dbConnection.commit();
      res.json({ success: true, message: 'Pesanan berhasil dikonfirmasi dan diarsipkan di blockchain.' });
    } catch (error) {
      console.error('Error in confirmPenerimaan:', error);
      if (dbConnection) await dbConnection.rollback();
      if (buktiFoto && await fs.access(buktiFoto.path).then(() => true).catch(() => false)) {
        await fs.unlink(buktiFoto.path);
      }
      res.status(500).json({ success: false, message: `Gagal konfirmasi: ${error.message}` });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },

  // Mengonfirmasi pesanan (mengubah status dari "Dipesan" menjadi "Perlu Dikirim")
  confirmPesanan: async (req, res) => {
    try {
      const { id } = req.params;
      const idPbf = req.user.id;

      console.log(`Processing konfirmasi pesanan for ID: ${id}, PBF ID: ${idPbf}`);

      const [pesanan] = await db.query(
        'SELECT id, status FROM pesanan WHERE id = ? AND id_pbf = ?',
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
      }

      if (pesanan[0].status !== 'Dipesan') {
        return res.status(400).json({
          success: false,
          message: 'Pesanan hanya dapat dikonfirmasi jika statusnya "Dipesan".',
        });
      }

      await db.query('UPDATE pesanan SET status = ? WHERE id = ?', ['Perlu Dikirim', id]);

      res.json({ success: true, message: 'Pesanan berhasil dikonfirmasi.' });
    } catch (error) {
      console.error('Error in confirmPesanan:', error);
      res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
    }
  },
};

module.exports = penerimaanController;