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
    const identity = await wallet.get('apotekAdmin'); // Identitas Apotek
    if (!identity) {
      throw new Error('Identitas "apotekAdmin" tidak ditemukan di wallet. Jalankan enrollAdminApotek.js');
    }
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org3.json'); // Koneksi Org 3
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

// --- Controller ---
const penjualanController = {

  /**
   * Mengambil stok obat yang siap dijual oleh Apotek.
   * Memanggil chaincode ApotekContract:queryStokApotek
   */
  getStokApotek: async (req, res) => {
    let gateway;
    try {
      gateway = await getApotekGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync'); 
      
      // Panggil fungsi queryStokApotek (tanpa argumen)
      const resultBytes = await contract.evaluateTransaction('ApotekContract:queryStokApotek');
      
      const results = JSON.parse(resultBytes.toString());
      
      // Ubah nama field agar konsisten dengan frontend
      const mappedResults = results.map(item => ({
          id: item.id,
          nama_obat: item.namaObat,
          dosis: item.dosis,
          bentuk_sediaan: item.bentukSediaan,
          jumlah: item.jumlah,
          harga_per_unit: item.hargaPerUnit
      }));
      
      res.json({ success: true, data: mappedResults });
      
    } catch (error) {
      console.error('Error getStokApotek:', error);
      res.status(500).json({ success: false, message: `Gagal mengambil stok: ${error.message}` });
    } finally {
      if (gateway) gateway.disconnect();
    }
  },

  /**
   * Memproses penjualan ke konsumen.
   * Mencatat di MySQL dan Blockchain.
   */
  prosesPenjualan: async (req, res) => {
    const { items, total_harga, nama_pelanggan } = req.body;
    const idApotek = req.user.id;
    const namaApoteker = req.user.nama_resmi;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang tidak boleh kosong.' });
    }

    let dbConnection;
    let gateway;
    const soldItemsInfo = []; // Untuk QR Code

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();
      
      gateway = await getApotekGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      // 1. Buat catatan Penjualan di MySQL
      const [penjualanResult] = await dbConnection.query(
        'INSERT INTO penjualan (id_apotek, nama_pelanggan, total_harga, penanggung_jawab_apoteker) VALUES (?, ?, ?, ?)',
        [idApotek, nama_pelanggan || 'Walk-in', total_harga, namaApoteker]
      );
      const penjualanId = penjualanResult.insertId;

      // 2. Loop setiap item di keranjang
      for (const item of items) {
        // Nama field dari frontend Penjualan.jsx
        const { id_aset_blockchain, jumlah_jual, harga_satuan, total_item, nama_obat } = item;
        
        // 2a. Catat detail penjualan di MySQL
        await dbConnection.query(
          'INSERT INTO detail_penjualan (id_penjualan, id_aset_blockchain, jumlah_jual, harga_satuan, total_harga) VALUES (?, ?, ?, ?, ?)',
          [penjualanId, id_aset_blockchain, jumlah_jual, harga_satuan, total_item]
        );

        // 2b. Panggil Chaincode (ApotekContract:jualKeKonsumen)
        console.log(`Submitting to blockchain: jualKeKonsumen(${id_aset_blockchain}, ${nama_pelanggan || 'Konsumen'}, ${jumlah_jual})`);
        const transaction = contract.createTransaction('ApotekContract:jualKeKonsumen');
        await transaction.submit(
            id_aset_blockchain, 
            nama_pelanggan || 'Konsumen', 
            jumlah_jual.toString()
        );
        
        soldItemsInfo.push({
            id_aset_blockchain,
            nama_obat,
            jumlah_jual
        });
      }

      await dbConnection.commit();
      
      res.json({ 
        success: true, 
        message: 'Penjualan berhasil dicatat.',
        penjualanId: penjualanId,
        soldAssetIds: soldItemsInfo // Kirim balik info item untuk QR Code
      });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in prosesPenjualan:', error);
      
      let errMsg = error.message;
      if (error.responses && error.responses[0] && error.responses[0].response) {
        errMsg = error.responses[0].response.message;
      } else if (error.message.includes('Stok tidak mencukupi')) {
        errMsg = error.message;
      }
      
      res.status(500).json({ success: false, message: `Proses penjualan gagal: ${errMsg}` });
    } finally {
      if (dbConnection) dbConnection.release();
      if (gateway) gateway.disconnect();
    }
  }
};

module.exports = penjualanController;