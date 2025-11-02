'use strict';
const db = require('../../config/db');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Gateway, Wallets } = require('fabric-network');
const grpc = require('@grpc/grpc-js');

// ... (calculateFileHash dan getGateway tetap sama) ...
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

async function getGateway() {
  try {
    console.log('Initializing Fabric Gateway connection...');
    
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Loading wallet from: ${walletPath}`);

    const identity = await wallet.get('pbfAdmin');
    if (!identity) {
        throw new Error('Identitas "pbfAdmin" tidak ditemukan di dalam wallet. Jalankan enrollAdminPbf.js terlebih dahulu.');
    }

    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json');
    console.log(`Loading connection profile from: ${ccpPath}`);
    const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'pbfAdmin',
        discovery: { enabled: true, asLocalhost: true }
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
    const { id } = req.params; // ID Pesanan
    const idPbf = req.user.id;
    const namaPbf = req.user.nama_resmi; // <-- AMBIL NAMA PBF DARI TOKEN
    const buktiFoto = req.file;

    let gateway;
    let dbConnection;

    try {
      if (!buktiFoto) {
        return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
      }

      // --- PERBAIKAN VALIDASI NAMA PBF ---
      if (!namaPbf) {
          return res.status(401).json({ success: false, message: 'Nama PBF tidak ditemukan di token Anda. Silakan login ulang.' });
      }
      // --- AKHIR PERBAIKAN ---

      console.log(`Processing penerimaan for pesanan ID: ${id}, PBF: ${namaPbf}, File: ${buktiFoto.path}`);

      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      const [pesanan] = await dbConnection.query(
        'SELECT id, status FROM pesanan WHERE id = ? AND id_pbf = ?',
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        await dbConnection.rollback();
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
      }

      if (pesanan[0].status !== 'Dikirim') {
        await dbConnection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Pesanan hanya dapat dikonfirmasi jika statusnya "Dikirim".',
        });
      }

      if (!await fs.access(buktiFoto.path).then(() => true).catch(() => false)) {
        throw new Error('File bukti foto tidak ditemukan di server.');
      }

      const hashBuktiFoto = await calculateFileHash(buktiFoto.path);
      console.log(`Hash bukti foto: ${hashBuktiFoto}`);

      gateway = await getGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      const [detailPesanan] = await dbConnection.query(
        'SELECT id_aset_blockchain FROM detail_pesanan WHERE id_pesanan = ?',
        [id]
      );

      if (detailPesanan.length === 0 || !detailPesanan[0].id_aset_blockchain) {
        throw new Error('ID Aset Blockchain untuk kiriman ini tidak ditemukan di database. Pastikan produsen sudah mencatat pengiriman.');
      }

      for (const item of detailPesanan) {
        if (item.id_aset_blockchain) {
          console.log(`Submitting transaction for asset_id: ${item.id_aset_blockchain}`);
          const transaction = contract.createTransaction('PbfContract:terimaBarang');
          transaction.setEndorsingOrganizations('PBFMSP', 'ProdusenMSP');
          
          // --- PERBAIKAN: KIRIM 3 ARGUMEN ---
          await transaction.submit(
            item.id_aset_blockchain, 
            hashBuktiFoto, 
            namaPbf // Argumen ke-3
          );
          // --- AKHIR PERBAIKAN ---
          
          console.log(`Transaction for asset_id: ${item.id_aset_blockchain} submitted successfully`);
        }
      }

      await dbConnection.query(
        'UPDATE pesanan SET status = ?, bukti_foto = ? WHERE id = ?',
        ['Selesai', buktiFoto.path, id]
      );
      
      await dbConnection.query(
        'UPDATE pesanan SET catatan_khusus = CONCAT(IFNULL(catatan_khusus, ""), ?) WHERE id = ?',
        [`\n[PENERIMAAN PBF]: Diterima oleh ${namaPbf}. Hash Bukti: ${hashBuktiFoto}`, id] // Detail lebih baik
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

  confirmPesanan: async (req, res) => {
    // ... (Fungsi ini tidak berubah) ...
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