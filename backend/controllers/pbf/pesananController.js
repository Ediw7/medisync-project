'use strict';

const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

const pesananController = {
    // Mengambil daftar semua pesanan milik PBF yang sedang login
    getAll: async (req, res) => {
        try {
            const sql = `
                SELECT 
                    p.id, p.nomor_po, p.tanggal_pesanan, p.status, 
                    u.nama_resmi AS nama_produsen, p.nama_pbf, p.alamat_pbf
                FROM pesanan p
                JOIN users u ON p.id_produsen = u.id
                WHERE p.id_pbf = ? 
                ORDER BY p.tanggal_pesanan DESC
            `;
            const [rows] = await db.query(sql, [req.user.id]);
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error in getAll:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    // Mengambil detail pesanan berdasarkan ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const sqlPesanan = `
                SELECT p.*, u.nama_resmi AS nama_produsen
                FROM pesanan p
                JOIN users u ON p.id_produsen = u.id
                WHERE p.id = ? AND p.id_pbf = ?
            `;
            const [pesanan] = await db.query(sqlPesanan, [id, req.user.id]);
            if (pesanan.length === 0) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
            }

            const sqlDetail = `
                SELECT dp.*, pr.batch_id
                FROM detail_pesanan dp
                JOIN produksi pr ON dp.id_produksi = pr.id
                WHERE dp.id_pesanan = ?
            `;
            const [detail] = await db.query(sqlDetail, [id]);

            res.json({
                success: true,
                data: {
                    pesanan: pesanan[0],
                    detail_pesanan: detail
                }
            });
        } catch (error) {
            console.error('Error in getById:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    // Membuat pesanan baru
    create: async (req, res) => {
        const {
            nomor_po,
            id_produsen,
            nama_pbf,
            alamat_pbf,
            nomor_siup,
            nomor_sia_sika,
            nama_apoteker,
            nomor_sipa,
            kontak_telepon,
            kontak_email,
            tanggal_pesanan,
            tujuan_distribusi,
            catatan_khusus,
            items, // Array of { id_produksi, jumlah_pesanan, harga_per_unit, total_harga }
            tanda_tangan_data_url
        } = req.body;
        const id_pbf = req.user.id;

        // Validasi field wajib
        if (!nomor_po || !id_produsen || !nama_pbf || !alamat_pbf || !nomor_siup ||
            !nomor_sia_sika || !nama_apoteker || !nomor_sipa || !kontak_telepon || !kontak_email ||
            !tanggal_pesanan || !items || !Array.isArray(items) || items.length === 0 || !tanda_tangan_data_url) {
            return res.status(400).json({ success: false, message: 'Semua field wajib diisi dan minimal satu item pesanan serta tanda tangan diperlukan.' });
        }

        let dbConnection;
        try {
            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();

            // Validasi id_produsen
            const [produsen] = await dbConnection.query("SELECT id FROM users WHERE id = ? AND role = 'produsen'", [id_produsen]);
            if (produsen.length === 0) {
                throw new Error('Produsen tidak ditemukan.');
            }

            // Simpan tanda tangan dari base64 ke file
            const base64Data = tanda_tangan_data_url.replace(/^data:image\/png;base64,/, "");
            const fileName = `ttd-pesanan-${Date.now()}.png`;
            const filePath = path.join('uploads', 'tanda_tangan', fileName);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, base64Data, 'base64');

            // Insert data pesanan
            const sqlPesanan = `
                INSERT INTO pesanan (
                    nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
                    nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
                    tujuan_distribusi, catatan_khusus, tanda_tangan_apoteker, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const paramsPesanan = [
            nomor_po, id_pbf, id_produsen, nama_pbf, alamat_pbf, nomor_siup, nomor_sia_sika,
            nama_apoteker, nomor_sipa, kontak_telepon, kontak_email, tanggal_pesanan,
            tujuan_distribusi || null, catatan_khusus || null, filePath, 'Perlu Dikirim'
            ];

            const [resultPesanan] = await dbConnection.query(sqlPesanan, paramsPesanan);
            const idPesanan = resultPesanan.insertId;

            // Insert detail pesanan dan validasi stok
            for (const item of items) {
                const { id_produksi, jumlah_pesanan, harga_per_unit, total_harga } = item;
                if (!id_produksi || !jumlah_pesanan || jumlah_pesanan <= 0) {
                    throw new Error('ID produksi dan jumlah pesanan wajib diisi dan harus lebih dari 0.');
                }

                // Cek stok di tabel produksi
                const [produksi] = await dbConnection.query(
                    'SELECT nama_obat, bentuk_sediaan, dosis, jumlah FROM produksi WHERE id = ? AND id_produsen = ? AND jumlah >= ?',
                    [id_produksi, id_produsen, jumlah_pesanan]
                );
                if (produksi.length === 0) {
                    throw new Error(`Stok tidak mencukupi atau obat dengan ID ${id_produksi} tidak ditemukan.`);
                }

                const sqlDetail = `
                    INSERT INTO detail_pesanan (
                        id_pesanan, id_produksi, nama_obat, bentuk_sediaan, dosis, jumlah_pesanan, harga_per_unit, total_harga
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const paramsDetail = [
                    idPesanan,
                    id_produksi,
                    produksi[0].nama_obat,
                    produksi[0].bentuk_sediaan,
                    produksi[0].dosis || null,
                    jumlah_pesanan,
                    harga_per_unit || null,
                    total_harga || null
                ];
                await dbConnection.query(sqlDetail, paramsDetail);

                // Kurangi stok di tabel produksi
                await dbConnection.query(
                    'UPDATE produksi SET jumlah = jumlah - ? WHERE id = ?',
                    [jumlah_pesanan, id_produksi]
                );
            }

            await dbConnection.commit();
            res.status(201).json({ success: true, message: 'Pesanan berhasil dibuat!', idPesanan });
        } catch (error) {
            if (dbConnection) await dbConnection.rollback();
            console.error('Error in create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'Nomor PO sudah digunakan.' });
            }
            res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
        } finally {
            if (dbConnection) dbConnection.release();
        }
    }
};

module.exports = pesananController;