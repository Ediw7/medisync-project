'use strict';

const db = require('../../config/db');

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

    // Mengambil stok yang tersedia dari tabel 'produksi' untuk produsen tertentu
   getAvailableStockByProdusen: async (req, res) => {
        try {
            const { idProdusen } = req.params;
            const sql = `
                SELECT id, batch_id, nama_obat, jumlah, dosis, bentuk_sediaan, harga_per_unit 
                FROM produksi 
                WHERE id_produsen = ? AND status IN ('Selesai', 'Tercatat di Blockchain') AND jumlah > 0
            `;
            const [rows] = await db.query(sql, [idProdusen]);
            res.json({ success: true, data: rows });
        } catch (error) {
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