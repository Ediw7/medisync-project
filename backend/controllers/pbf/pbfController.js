'use strict';

const db = require('../../config/db');
const nano = require('nano')('http://admin:adminpw@127.0.0.1:5984'); // Koneksi ke CouchDB

// Fungsi untuk mengambil data stok dari CouchDB (on-chain)
async function fetchStockFromCouchDB(idProdusen) {
  try {
    // Di dunia nyata, Anda akan memetakan idProdusen ke MSP ID, misal id 1 -> ManufacturerMSP
    const mspId = 'ProdusenMSP'; 
    const dbName = 'medisyncchannel_medisync';
    const dbInstance = nano.use(dbName);

    const query = {
      selector: {
        docType: 'obat',
        pemilikSaatIni: mspId,
        jumlah: { "$gt": 0 } // Hanya ambil yang stoknya lebih dari 0
      }
    };

    const result = await dbInstance.find(query);
    // Map data agar formatnya konsisten dengan yang diharapkan frontend
    return result.docs.map(doc => ({
      id: doc._id, // ID unik di CouchDB adalah batch_id
      batch_id: doc._id,
      nama_obat: doc.namaObat,
      bentuk_sediaan: doc.bentukSediaan,
      dosis: doc.dosis,
      jumlah: doc.jumlah,
      harga_per_unit: doc.hargaPerUnit || 150000, // Ambil harga jika ada, atau beri default
    }));
  } catch (error) {
    // Jika CouchDB error atau tidak ada, kembalikan array kosong
    console.error('Error fetching from CouchDB:', error.message);
    return [];
  }
}

const pbfController = {
    // Mengambil daftar semua produsen yang terdaftar
    getProdusenList: async (req, res) => {
        try {
            const [rows] = await db.query("SELECT id, nama_resmi, alamat, email FROM users WHERE role = 'produsen'");
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error in getProdusenList:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    // --- PERBAIKAN UTAMA DI SINI ---
    // Sekarang hanya mengambil data dari "sumber kebenaran" (blockchain)
    getAvailableStockByProdusen: async (req, res) => {
        try {
            const { idProdusen } = req.params;
            const onChainStock = await fetchStockFromCouchDB(idProdusen);
            res.json({ success: true, data: onChainStock, source: 'on-chain' });
        } catch (error) {
            console.error('Error in getAvailableStockByProdusen:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Mengambil profil PBF yang sedang login
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