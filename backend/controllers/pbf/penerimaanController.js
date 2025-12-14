'use strict';
const db = require('../../config/db');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Gateway, Wallets } = require('fabric-network');

// --- HELPER 1: Menghitung Hash File (SHA-256) ---
async function calculateFileHash(filePath) {
  try {
    console.log(`[HASH] Menghitung hash untuk file: ${filePath}`);
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    const fileHash = hash.digest('hex');
    console.log(`[HASH] Hasil: ${fileHash}`);
    return fileHash;
  } catch (error) {
    console.error('Error calculating file hash:', error);
    throw new Error(`Gagal menghitung hash file: ${error.message}`);
  }
}

// --- HELPER 2: Setup Gateway Blockchain (DINAMIS USER - ABAC) ---
// Menerima parameter 'username' agar transaksi dilakukan atas nama user tersebut
async function getGateway(username) {
  try {
    console.log(`[GATEWAY] Menginisialisasi koneksi untuk user: ${username}...`);
    
    // 1. Setup Wallet Path
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // 2. Cek apakah Identity User ada di Wallet
    const identity = await wallet.get(username);
    if (!identity) {
        throw new Error(`Identitas untuk user "${username}" tidak ditemukan di wallet server. Pastikan user sudah melakukan registrasi dengan benar.`);
    }

    // 3. Setup Connection Profile (PBF menggunakan Org2)
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json');
    
    // Cek keberadaan file connection profile
    try {
        await fs.access(ccpPath);
    } catch {
        throw new Error(`Connection profile tidak ditemukan di: ${ccpPath}`);
    }
    
    const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

    // 4. Connect Gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: username, // <--- KUNCI ABAC: Menggunakan username user yang login
        discovery: { enabled: true, asLocalhost: true }
    });

    console.log('[GATEWAY] Koneksi berhasil.');
    return gateway;

  } catch (error) {
    console.error('[GATEWAY ERROR]:', error);
    throw new Error(`Gagal menginisialisasi koneksi ke blockchain: ${error.message}`);
  }
}

const penerimaanController = {
  
  // --- FUNGSI UTAMA: Konfirmasi Penerimaan (Blockchain + DB) ---
  confirmPenerimaan: async (req, res) => {
    const { id } = req.params; // ID Pesanan (SQL)
    
    // Ambil data dari Token JWT (req.user diset oleh middleware auth)
    const idPbf = req.user.id;
    const namaPbf = req.user.nama_resmi; 
    const username = req.user.username; // Username untuk wallet ABAC
    
    const buktiFoto = req.file;

    let gateway;
    let dbConnection;

    try {
      // 1. Validasi Input Dasar
      if (!buktiFoto) {
        return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
      }

      if (!namaPbf) {
          return res.status(401).json({ success: false, message: 'Nama PBF tidak ditemukan di token. Silakan login ulang.' });
      }

      console.log(`[PROCESS] Penerimaan Pesanan ID: ${id} oleh ${username} (${namaPbf})`);

      // 2. Mulai Transaksi Database SQL
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // 3. Validasi Status Pesanan di Database
      const [pesanan] = await dbConnection.query(
        'SELECT id, status FROM pesanan WHERE id = ? AND id_pbf = ?',
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        await dbConnection.rollback();
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau bukan milik Anda.' });
      }

      if (pesanan[0].status !== 'Dikirim') {
        await dbConnection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Pesanan hanya dapat dikonfirmasi jika statusnya "Dikirim".',
        });
      }

      // 4. Hitung Hash Bukti Foto
      const hashBuktiFoto = await calculateFileHash(buktiFoto.path);

      // 5. Inisialisasi Gateway Blockchain (User Identity)
      gateway = await getGateway(username); 
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      // 6. Ambil ID Aset Blockchain dari Detail Pesanan
      const [detailPesanan] = await dbConnection.query(
        'SELECT id_aset_blockchain FROM detail_pesanan WHERE id_pesanan = ?',
        [id]
      );

      if (detailPesanan.length === 0 || !detailPesanan.some(item => item.id_aset_blockchain)) {
        throw new Error('ID Aset Blockchain tidak ditemukan untuk pesanan ini.');
      }

      // 7. Submit Transaksi ke Blockchain (Looping per item obat)
      for (const item of detailPesanan) {
        if (item.id_aset_blockchain) {
          console.log(`[BLOCKCHAIN] Submitting transaction for asset: ${item.id_aset_blockchain}`);
          
          // Panggil Smart Contract
          // Chaincode akan mengecek atribut 'role' milik 'username'
          const transaction = contract.createTransaction('PbfContract:terimaBarang');
          transaction.setEndorsingOrganizations('PBFMSP', 'ProdusenMSP'); // Endorsement policy
          
          await transaction.submit(
            item.id_aset_blockchain, 
            hashBuktiFoto, 
            namaPbf // Mengirim nama resmi PBF untuk dicatat di riwayat
          );
          
          console.log(`[BLOCKCHAIN] Success for asset: ${item.id_aset_blockchain}`);
        }
      }

      // 8. Update Database SQL (Status & Bukti)
      const pathFotoDb = buktiFoto.path.replace(/\\/g, '/'); // Normalisasi path windows
      await dbConnection.query(
        'UPDATE pesanan SET status = ?, bukti_foto = ? WHERE id = ?',
        ['Selesai', pathFotoDb, id]
      );
      
      // Tambahkan Log Catatan
      await dbConnection.query(
        'UPDATE pesanan SET catatan_khusus = CONCAT(IFNULL(catatan_khusus, ""), ?) WHERE id = ?',
        [`\n[${new Date().toISOString()}] Diterima oleh ${namaPbf}. Validasi Blockchain OK.`, id]
      );

      // 9. Commit Transaksi SQL
      await dbConnection.commit();
      
      res.json({ 
          success: true, 
          message: 'Penerimaan berhasil dikonfirmasi, tervalidasi ABAC, dan tercatat di blockchain.' 
      });

    } catch (error) {
      console.error('[CONTROLLER ERROR]:', error);
      
      // Rollback SQL jika ada error
      if (dbConnection) await dbConnection.rollback();
      
      // Hapus file foto jika gagal agar tidak menumpuk sampah
      if (buktiFoto && await fs.access(buktiFoto.path).then(() => true).catch(() => false)) {
        await fs.unlink(buktiFoto.path);
      }
      
      res.status(500).json({ success: false, message: `Gagal konfirmasi: ${error.message}` });

    } finally {
      // Tutup koneksi gateway & release DB connection
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },

  // --- FUNGSI SEKUNDER: Konfirmasi Pesanan (Hanya SQL) ---
  // Fungsi ini dipanggil saat PBF pertama kali menyetujui pesanan dari Produsen (sebelum barang dikirim)
  confirmPesanan: async (req, res) => {
    try {
      const { id } = req.params;
      const idPbf = req.user.id;

      console.log(`[PROCESS] Konfirmasi Pesanan Baru ID: ${id} oleh PBF ID: ${idPbf}`);

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

      res.json({ success: true, message: 'Pesanan berhasil dikonfirmasi. Menunggu pengiriman produsen.' });
    } catch (error) {
      console.error('Error in confirmPesanan:', error);
      res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
    }
  },
};

module.exports = penerimaanController;