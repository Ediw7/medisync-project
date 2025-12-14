/* File: controllers/apotek/penerimaanController.js
   Deskripsi: Controller untuk menangani penerimaan barang oleh Apotek dengan validasi ABAC & Blockchain
*/

'use strict';

const db = require('../../config/db');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Gateway, Wallets } = require('fabric-network');

// --- HELPER 1: Menghitung Hash File (SHA-256) ---
async function calculateFileHash(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (error) {
    console.error('Error calculating file hash:', error);
    throw new Error(`Gagal menghitung hash file: ${error.message}`);
  }
}

// --- HELPER 2: Setup Gateway Apotek (DINAMIS USER - ABAC) ---
// Menerima parameter 'username' untuk memastikan transaksi dilakukan oleh user yang bersangkutan
async function getApotekGateway(username) {
  try {
    console.log(`[GATEWAY APOTEK] Menginisialisasi koneksi untuk user: ${username}...`);

    // 1. Setup Wallet Path
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // 2. Cek apakah Identity User ada di Wallet
    const identity = await wallet.get(username);
    if (!identity) {
      throw new Error(`Identitas untuk user "${username}" tidak ditemukan di wallet server. Pastikan user sudah registrasi.`);
    }

    // 3. Setup Connection Profile (Apotek biasanya Org3)
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org3.json');
    
    // Cek file connection profile
    try {
        await fs.access(ccpPath);
    } catch {
        throw new Error(`Connection profile Org3 tidak ditemukan di: ${ccpPath}`);
    }

    const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

    // 4. Connect Gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: username, // <--- KUNCI ABAC: Gunakan username user yang login
      discovery: { enabled: true, asLocalhost: true }
    });

    console.log('[GATEWAY APOTEK] Koneksi berhasil.');
    return gateway;
  } catch (error) {
    console.error('Error initializing Apotek gateway:', error);
    throw new Error(`Gagal koneksi blockchain: ${error.message}`);
  }
}

// --- CONTROLLER UTAMA ---
const penerimaanController = {
  
  confirmPenerimaan: async (req, res) => {
    const { id } = req.params; // ID Pesanan Apotek (SQL)
    
    // Ambil data dari Token JWT
    const idApotek = req.user.id;
    const namaApoteker = req.user.nama_resmi;
    const username = req.user.username; // Username untuk Wallet ABAC
    
    const buktiFoto = req.file;

    let gateway;
    let dbConnection;

    try {
      // 1. Validasi Input
      if (!buktiFoto) {
        return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
      }
 
     if (!namaApoteker) {
         return res.status(401).json({ success: false, message: 'Nama Apoteker tidak ditemukan di token. Silakan login ulang.' });
      }

      console.log(`[PROCESS] Konfirmasi Penerimaan Apotek ID: ${id} oleh ${username}`);

      // 2. Mulai Transaksi Database SQL
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // 3. Cek Status Pesanan di DB
      const [pesanan] = await dbConnection.query(
        'SELECT id, status FROM pesanan_apotek WHERE id = ? AND id_apotek = ?',
        [id, idApotek]
      );

      if (pesanan.length === 0) {
        throw new Error('Pesanan tidak ditemukan atau Anda tidak berwenang.');
      }
      if (pesanan[0].status !== 'Dikirim') {
        throw new Error('Pesanan hanya dapat dikonfirmasi jika statusnya "Dikirim".');
      }

      // 4. Hitung Hash
      const hashBuktiFoto = await calculateFileHash(buktiFoto.path);
      console.log(`[HASH] Bukti Foto: ${hashBuktiFoto}`);

      // 5. Connect ke Blockchain via Gateway (ABAC)
      gateway = await getApotekGateway(username);
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      // 6. Ambil ID Aset Blockchain
      const [detailPesanan] = await dbConnection.query(
        'SELECT id_aset_blockchain FROM detail_pesanan_apotek WHERE id_pesanan_apotek = ?',
        [id]
      );

      if (detailPesanan.length === 0 || !detailPesanan.some(item => item.id_aset_blockchain)) {
        throw new Error('ID Aset Blockchain untuk pesanan ini tidak ditemukan di database.');
      }

      // 7. Submit Transaksi ke Blockchain
      for (const item of detailPesanan) {
        if (item.id_aset_blockchain) {
            console.log(`[BLOCKCHAIN] Submitting transaction for asset: ${item.id_aset_blockchain}`);
            
            // Panggil Smart Contract
            // Chaincode akan memvalidasi apakah 'username' memiliki atribut role yang sesuai
            const transaction = contract.createTransaction('ApotekContract:terimaBarang');
            transaction.setEndorsingOrganizations('ApotekMSP', 'PBFMSP');
            
            await transaction.submit(
                item.id_aset_blockchain, 
                hashBuktiFoto, 
                namaApoteker, 
                idApotek.toString()
            );
        }
      }

      // 8. Emit Event Socket.IO (Realtime Update)
      if (req.io) {
          req.io.emit('block_mined', {
            type: 'PENERIMAAN_APOTEK',
            hash: '0x' + crypto.randomBytes(32).toString('hex'), // Simulasi TxHash untuk UI
            timestamp: new Date().toLocaleTimeString(),
            org: 'ApotekMSP',
            details: `Received by Apotek (Order ID: ${id}) - User: ${username}`
          });
      }

      // 9. Update Database SQL
      const pathFotoDb = buktiFoto.path.replace(/\\/g, '/'); // Normalisasi path
      await dbConnection.query(
        "UPDATE pesanan_apotek SET status = 'Selesai', bukti_foto = ? WHERE id = ?",
        [pathFotoDb, id]
      );

      // 10. Commit Database Transaction
      await dbConnection.commit();
      
      res.json({ 
          success: true, 
          message: 'Penerimaan pesanan berhasil dikonfirmasi dan dicatat di blockchain (ABAC Verified).' 
      });

    } catch (error) {
      // Error Handling
      console.error('[CONTROLLER ERROR] Apotek confirmPenerimaan:', error);
      
      if (dbConnection) await dbConnection.rollback();
      
      // Hapus file upload jika gagal
      if (buktiFoto?.path) {
        try { await fs.unlink(buktiFoto.path); } catch (e) {} 
      }
      
      res.status(500).json({ success: false, message: `Gagal konfirmasi: ${error.message}` });

    } finally {
      // Cleanup Connections
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },
};

module.exports = penerimaanController;