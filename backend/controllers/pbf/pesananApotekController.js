'use strict';
const db = require('../../config/db');

const pesananApotekController = {
    // Untuk Apotek: Membuat pesanan baru ke PBF
    createPesanan: async (req, res) => {
        const idApotek = req.user.id;
        const {
            id_pbf,
            nama_apotek,
            alamat_apotek,
            jabatan,
            nomor_sipa,
            telepon,
            items, // [{ nama_obat, keterangan, qty, satuan, harga_satuan }]
            tanda_tangan_data_url
        } = req.body;
        
        // Simpan tanda tangan (logika sama seperti pesanan PBF)
        // ... (Tambahkan logika penyimpanan file tanda tangan di sini)

        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            const total_harga = items.reduce((sum, item) => sum + (item.qty * item.harga_satuan), 0);

            const [result] = await connection.query(
                `INSERT INTO pesanan_apotek (id_apotek, id_pbf, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon, total_harga, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [idApotek, id_pbf, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon, total_harga, 'Menunggu Konfirmasi']
            );
            
            const idPesanan = result.insertId;

            for (const item of items) {
                await connection.query(
                    `INSERT INTO detail_pesanan_apotek (id_pesanan_apotek, nama_obat, keterangan, jumlah, satuan, harga_satuan)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [idPesanan, item.nama_obat, item.keterangan, item.qty, item.satuan, item.harga_satuan]
                );
            }

            await connection.commit();
            res.status(201).json({ success: true, message: 'Pesanan ke PBF berhasil dibuat.' });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error creating pesanan apotek:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        } finally {
            if (connection) connection.release();
        }
    },

    // Untuk PBF: Mendapatkan semua pesanan yang masuk dari Apotek
    getAllPesananMasuk: async (req, res) => {
        const idPbf = req.user.id;
        try {
            const [rows] = await db.query(
                'SELECT * FROM pesanan_apotek WHERE id_pbf = ? ORDER BY tanggal_pesanan DESC',
                [idPbf]
            );
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error getting pesanan apotek:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    getPesananById: async (req, res) => {
        const { id } = req.params;
        const idPbf = req.user.id; // Pastikan pesanan ini milik PBF yang login

        try {
            // Ambil data pesanan utama
            const [pesananRows] = await db.query(
                `SELECT pa.*, pbf.nama_resmi as nama_pbf 
                 FROM pesanan_apotek pa
                 JOIN users pbf ON pa.id_pbf = pbf.id
                 WHERE pa.id = ? AND pa.id_pbf = ?`,
                [id, idPbf]
            );

            if (pesananRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
            }

            // Ambil detail item pesanan
            const [detailRows] = await db.query(
                'SELECT * FROM detail_pesanan_apotek WHERE id_pesanan_apotek = ?',
                [id]
            );

            res.json({
                success: true,
                data: {
                    pesanan: pesananRows[0],
                    detail_pesanan: detailRows,
                },
            });
        } catch (error) {
            console.error(`Error getting pesanan apotek by ID ${id}:`, error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    prosesPesanan: async (req, res) => {
        const { id } = req.params;
        const idPbf = req.user.id;

        try {
            // Cek dulu apakah pesanan ada dan statusnya 'Menunggu Konfirmasi'
            const [pesanan] = await db.query(
                'SELECT * FROM pesanan_apotek WHERE id = ? AND id_pbf = ? AND status = "Menunggu Konfirmasi"',
                [id, idPbf]
            );

            if (pesanan.length === 0) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau sudah diproses.' });
            }

            // Update status menjadi 'Perlu Dikirim'
            await db.query(
                "UPDATE pesanan_apotek SET status = 'Perlu Dikirim' WHERE id = ?",
                [id]
            );

            res.json({ success: true, message: 'Pesanan berhasil diproses dan siap untuk diatur pengirimannya.' });
        } catch (error) {
            console.error('Error processing pesanan apotek:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },
};

module.exports = pesananApotekController;