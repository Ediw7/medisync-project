'use strict';

const db = require('../../config/db');
const nano = require('nano')('http://admin:adminpw@127.0.0.1:5984'); // Koneksi ke CouchDB

/**
 * Mengambil stok dari CouchDB berdasarkan nama perusahaan produsen.
 * * --- PERBAIKAN 1: Fungsi ini sekarang juga menerima idProdusen ---
 * Ini diperlukan agar kita bisa meneruskannya ke objek yang di-map.
 */
async function fetchStockFromCouchDB(namaPerusahaanProdusen, idProdusen) {
  try {
    const mspId = 'ProdusenMSP'; 
    const dbName = 'medisyncchannel_medisync';
    const dbInstance = nano.use(dbName);

    const query = {
      selector: {
        docType: 'obat',
        pemilikSaatIni: mspId,
        namaPerusahaan: namaPerusahaanProdusen, // <-- INI KUNCINYA
        jumlah: { "$gt": 0 } 
      }
    };

    const result = await dbInstance.find(query);
    
    // Map data agar formatnya konsisten
    return result.docs.map(doc => ({
      id: doc.id || doc._id,
      batch_id: doc.id || doc._id,
      nama_obat: doc.namaObat,
      bentuk_sediaan: doc.bentukSediaan,
      dosis: doc.dosis,
      jumlah: doc.jumlah,
      harga_per_unit: doc.hargaPerUnit || 0,
      
      // --- PERBAIKAN 2: Gunakan idProdusen yang dilewatkan sebagai argumen ---
      id_produsen: idProdusen, 

      // --- PERBAIKAN 3 (UTAMA): Tambahkan field ini kembali! ---
      // Ini diperlukan agar filter kedua di 'getAvailableStockByProdusen' berfungsi.
      namaPerusahaan: doc.namaPerusahaan 
    }));
  } catch (error) {
    console.error('Error fetching from CouchDB:', error.message);
    return [];
  }
}

const pbfController = {
    getProdusenList: async (req, res) => {
        try {
            const [rows] = await db.query("SELECT id, nama_resmi, alamat, email FROM users WHERE role = 'produsen'");
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error in getProdusenList:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    getAvailableStockByProdusen: async (req, res) => {
        try {
            const { idProdusen } = req.params;

            // 1. Cari nama_resmi (nama perusahaan) dari idProdusen
            const [produsenRows] = await db.query(
                "SELECT nama_resmi FROM users WHERE id = ? AND role = 'produsen'",
                [idProdusen]
            );

            if (produsenRows.length === 0) {
                throw new Error('Produsen tidak ditemukan di database lokal.');
            }
            const namaPerusahaan = produsenRows[0].nama_resmi;
            
            // 2. Gunakan namaPerusahaan untuk query ke CouchDB
            // --- PERBAIKAN 4: Kirim idProdusen ke fungsi helper ---
            const onChainStock = await fetchStockFromCouchDB(namaPerusahaan, idProdusen);
            
            // 3. (PENTING) Filter kedua ini SEKARANG AKAN BERFUNGSI
            // karena 'onChainStock' sekarang memiliki properti '.namaPerusahaan'.
            const finalStock = onChainStock.filter(stok => stok.namaPerusahaan === namaPerusahaan);

            res.json({ success: true, data: finalStock, source: 'on-chain' });

        } catch (error) {
            console.error('Error in getAvailableStockByProdusen:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getProfile: async (req, res) => {
        try {
            const [rows] = await db.query(
                "SELECT id, nama_resmi, alamat, email, nomor_izin FROM users WHERE id = ? AND role = 'pbf'",
                [req.user.id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Profil PBF tidak ditemukan.' });
            }
            res.json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Error in getProfile:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    }
};

module.exports = pbfController;