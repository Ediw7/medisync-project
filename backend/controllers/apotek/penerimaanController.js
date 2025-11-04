'use strict';

const db = require('../../config/db');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Gateway, Wallets } = require('fabric-network');

// --- HELPER FUNCTIONS (Disesuaikan untuk Apotek) ---

async function calculateFileHash(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (error) {
    console.error('Error calculating file hash:', error);
    throw new Error(`Gagal menghitung hash file: ${error.message}`);
  }
}

// PENYESUAIAN UNTUK APOTEK: Menggunakan identitas dan koneksi Apotek (Org3)
async function getApotekGateway() {
  try {
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('apotekAdmin');
    if (!identity) {
      throw new Error('Identitas "apotekAdmin" tidak ditemukan di wallet. Jalankan enrollAdminApotek.js terlebih dahulu.');
    }

    // Gunakan connection profile untuk Apotek (misal: connection-org3.json)
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org3.json');
    const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'apotekAdmin', // Gunakan identitas Apotek
      discovery: { enabled: true, asLocalhost: true }
    });
    return gateway;
  } catch (error) {
    console.error('Error initializing Apotek gateway:', error);
    throw new Error(`Gagal menginisialisasi koneksi ke blockchain: ${error.message}`);
  }
}

// --- CONTROLLER LOGIC ---

const penerimaanController = {
  confirmPenerimaan: async (req, res) => {
    const { id } = req.params; // ID Pesanan Apotek
    const idApotek = req.user.id;
    const namaApoteker = req.user.nama_resmi;
    const buktiFoto = req.file;

    let gateway;
    let dbConnection;

    try {
      if (!buktiFoto) {
        return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
      }
 
     if (!namaApoteker) {
         throw new Error('Nama Apoteker tidak ditemukan di token. Silakan login ulang.');
      }

      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // PENYESUAIAN UNTUK APOTEK: Cek ke tabel 'pesanan_apotek'
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

      const hashBuktiFoto = await calculateFileHash(buktiFoto.path);

      console.log(`[DEBUG] Pesanan Apotek ID: ${id}`);
      console.log(`[DEBUG] Hash Bukti Foto: ${hashBuktiFoto}`);

      gateway = await getApotekGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      // PENYESUAIAN UNTUK APOTEK: Ambil asset ID dari 'detail_pesanan_apotek'
      const [detailPesanan] = await dbConnection.query(
        'SELECT id_aset_blockchain FROM detail_pesanan_apotek WHERE id_pesanan_apotek = ?',
        [id]
      );

      if (detailPesanan.length === 0 || !detailPesanan.some(item => item.id_aset_blockchain)) {
        throw new Error('ID Aset Blockchain untuk pesanan ini tidak ditemukan di database.');
      }

         console.log('[DEBUG] Aset ID yang akan dikirim ke chaincode:', JSON.stringify(detailPesanan, null, 2));

      for (const item of detailPesanan) {
        if (item.id_aset_blockchain) {
          // PENYESUAIAN UNTUK APOTEK: Panggil chaincode milik Apotek
          const transaction = contract.createTransaction('ApotekContract:terimaBarang');
          // Endorsing policy mungkin antara Apotek dan PBF
          transaction.setEndorsingOrganizations('ApotekMSP', 'PBFMSP');
         await transaction.submit(item.id_aset_blockchain, hashBuktiFoto, namaApoteker);
        }
      }

      // PENYESUAIAN UNTUK APOTEK: Update tabel 'pesanan_apotek'
      await dbConnection.query(
        "UPDATE pesanan_apotek SET status = 'Selesai', bukti_foto = ? WHERE id = ?",
        [buktiFoto.path.replace(/\\/g, '/'), id]
      );

      await dbConnection.commit();
      res.json({ success: true, message: 'Penerimaan pesanan berhasil dikonfirmasi dan dicatat di blockchain.' });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      if (buktiFoto?.path) {
        try { await fs.unlink(buktiFoto.path); } catch (e) {} // Hapus file jika gagal
      }
      console.error('Error in Apotek confirmPenerimaan:', error);
      res.status(500).json({ success: false, message: `Gagal konfirmasi: ${error.message}` });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },
};

module.exports = penerimaanController;