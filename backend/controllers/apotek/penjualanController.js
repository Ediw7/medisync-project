// routes/apotek/penjualanController.js - VERSI DIPERBAIKI

'use strict';
const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

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
    console.error('❌ Error initializing Apotek gateway:', error);
    throw new Error(`Gagal koneksi ke blockchain: ${error.message}`);
  }
}

const penjualanController = {
  getStokApotek: async (req, res) => {
    let gateway;
    try {
      console.log('📦 Fetching stok apotek...');
      
      gateway = await getApotekGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync'); 
      
      const resultBytes = await contract.evaluateTransaction('ApotekContract:queryStokApotek');
      const results = JSON.parse(resultBytes.toString());

      // ===== DEBUGGING LENGKAP =====
      console.log('✅ RAW BLOCKCHAIN DATA:', JSON.stringify(results, null, 2));
      console.log(`📊 Total items: ${results.length}`);
      
      if (results.length === 0) {
        console.log('⚠️  TIDAK ADA DATA dari queryStokApotek!');
        console.log('Kemungkinan penyebab:');
        console.log('1. Tidak ada obat dengan status DITERIMA_APOTEK');
        console.log('2. pemilikSaatIni bukan ApotekMSP');
        console.log('3. jumlah = 0');
        console.log('4. Ada typo di status (spasi ekstra, kapitalisasi)');
      } else {
        // Log sample data untuk debug
        console.log('📋 Sample item pertama:', results[0]);
      }
      // =============================

      // Mapping data dengan pengecekan field
      const mappedResults = results.map(item => {
        // Cek field mana yang ada
        const namaObat = item.namaObat || item.nama_obat || 'Unknown';
        
        console.log(`Mapping item ${item.id}:`, {
          namaObat_exists: !!item.namaObat,
          nama_obat_exists: !!item.nama_obat,
          final_name: namaObat
        });

        return {
          id: item.id,
          nama_obat: namaObat,
          dosis: item.dosis || '-',
          bentuk_sediaan: item.bentukSediaan || item.bentuk_sediaan || '-',
          jumlah: item.jumlah || 0,
          harga_per_unit: item.hargaPerUnit || item.harga_per_unit || 0,
          id_aset_blockchain: item.id,
          batch_id: item.idBatchAsal || item.id
        };
      });

      console.log('✅ Mapped results:', mappedResults.length, 'items');
      res.json({ success: true, data: mappedResults });
      
    } catch (error) {
      console.error('❌ ERROR getStokApotek:', error.message);
      console.error('Stack:', error.stack);
      
      // Kirim error detail ke frontend
      res.status(500).json({ 
        success: false, 
        message: `Gagal: ${error.message}`,
        debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      if (gateway) gateway.disconnect();
    }
  },

  prosesPenjualan: async (req, res) => {
    const { items, total_harga, nama_pelanggan } = req.body;
    const idApotek = req.user.id;
    const namaApoteker = req.user.nama_resmi;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang tidak boleh kosong.' });
    }

    let dbConnection;
    let gateway;
    const soldItemsInfo = [];

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();
      
      gateway = await getApotekGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      const [penjualanResult] = await dbConnection.query(
        'INSERT INTO penjualan (id_apotek, nama_pelanggan, total_harga, penanggung_jawab_apoteker) VALUES (?, ?, ?, ?)',
        [idApotek, nama_pelanggan || 'Walk-in', total_harga, namaApoteker]
      );
      const penjualanId = penjualanResult.insertId;

      // ... di dalam prosesPenjualan
      for (const item of items) {
        // Nama field dari frontend Penjualan.jsx
        const { id_aset_blockchain, jumlah_jual, harga_satuan, total_item, nama_obat } = item;
        
        // 2a. Catat detail penjualan di MySQL
        await dbConnection.query(
          'INSERT INTO detail_penjualan (id_penjualan, id_aset_blockchain, nama_obat, jumlah_jual, harga_satuan, total_harga) VALUES (?, ?, ?, ?, ?, ?)',
          [penjualanId, id_aset_blockchain, nama_obat, jumlah_jual, harga_satuan, total_item]
        );
// ... (sisa loop)

        console.log(`🔗 Submitting blockchain: jualKeKonsumen(${id_aset_blockchain}, ${nama_pelanggan || 'Konsumen'}, ${jumlah_jual})`);
        
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
        soldAssetIds: soldItemsInfo
      });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('❌ Error in prosesPenjualan:', error);
      
      let errMsg = error.message;
      if (error.responses && error.responses[0] && error.responses[0].response) {
        errMsg = error.responses[0].response.message;
      }
      
      res.status(500).json({ success: false, message: `Proses penjualan gagal: ${errMsg}` });
    } finally {
      if (dbConnection) dbConnection.release();
      if (gateway) gateway.disconnect();
    }
  },
  /**
   * GET /api/apotek/penjualan/riwayat
   * Mengambil daftar semua penjualan yang dilakukan oleh apotek.
   */
  getAllPenjualan: async (req, res) => {
    const idApotek = req.user.id;
    try {
      const [rows] = await db.query(
        `SELECT id, nama_pelanggan, total_harga, penanggung_jawab_apoteker, tanggal_penjualan 
         FROM penjualan 
         WHERE id_apotek = ? 
         ORDER BY tanggal_penjualan DESC`,
        [idApotek]
      );
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error getAllPenjualan:', error);
      res.status(500).json({ success: false, message: `Gagal mengambil riwayat penjualan: ${error.message}` });
    }
  },

  /**
   * GET /api/apotek/penjualan/riwayat/:id
   * Mengambil detail satu penjualan (termasuk item dan QR code).
   */
  getDetailPenjualan: async (req, res) => {
    const { id } = req.params; // id_penjualan
    const idApotek = req.user.id;
    let dbConnection;
    try {
      dbConnection = await db.getConnection();
      
      // 1. Ambil data penjualan utama
      const [penjualan] = await dbConnection.query(
        "SELECT * FROM penjualan WHERE id = ? AND id_apotek = ?",
        [id, idApotek]
      );

      if (penjualan.length === 0) {
        return res.status(404).json({ success: false, message: "Riwayat penjualan tidak ditemukan." });
      }

      // 2. Ambil data detail item yang terjual
      const [detail] = await dbConnection.query(
        "SELECT * FROM detail_penjualan WHERE id_penjualan = ?",
        [id]
      );

      res.json({ 
        success: true, 
        data: {
          penjualan: penjualan[0],
          detail: detail
        } 
      });

    } catch (error) {
      console.error('Error getDetailPenjualan:', error);
      res.status(500).json({ success: false, message: `Gagal mengambil detail penjualan: ${error.message}` });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  }

  
};

module.exports = penjualanController;