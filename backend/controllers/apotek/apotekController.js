'use strict';
const db = require('../../config/db');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
const path = require('path');
const fs = require('fs').promises;

const apotekController = {
    // getPbfList dan createPesanan tidak berubah
    getPbfList: async (req, res) => {
        try {
            const [rows] = await db.query("SELECT id, nama_resmi, alamat, email FROM users WHERE role = 'pbf'");
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error in getPbfList:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    // --- FUNGSI INI DIPERBARUI ---
    getAvailableStockByPbf: async (req, res) => {
        const { idPbf } = req.params;
        const idApotek = req.user.id; // Mengambil ID apotek yang sedang login

        try {
            // 1. Ambil stok aktual dari PBF via Blockchain (CouchDB)
            const dbName = process.env.COUCHDB_DB || 'medisyncchannel_medisync';
            const dbInstance = nano.use(dbName);
            const query = {
                selector: { docType: 'obat', pemilikSaatIni: 'PBFMSP', jumlah: { "$gt": 0 } },
                fields: ['id', 'namaObat', 'bentukSediaan', 'dosis', 'jumlah', 'hargaPerUnit']
            };
            const result = await dbInstance.find(query);
            const onChainStock = result.docs.map(doc => ({
                id: doc.id,
                nama_obat: doc.namaObat,
                bentuk_sediaan: doc.bentukSediaan,
                dosis: doc.dosis,
                jumlah: doc.jumlah,
                harga_per_unit: doc.hargaPerUnit || 0
            }));

            // 2. Ambil riwayat harga terakhir dari MySQL untuk apotek ini
            const sqlRiwayatHarga = `
                WITH LastPurchase AS (
                    SELECT
                        dpa.nama_obat,
                        MAX(pa.id) AS last_pesanan_id
                    FROM pesanan_apotek pa
                    JOIN detail_pesanan_apotek dpa ON pa.id = dpa.id_pesanan_apotek
                    WHERE pa.id_apotek = ? AND pa.id_pbf = ?
                    GROUP BY dpa.nama_obat
                )
                SELECT
                    dpa.nama_obat,
                    dpa.harga_satuan
                FROM detail_pesanan_apotek dpa
                JOIN LastPurchase lp ON dpa.id_pesanan_apotek = lp.last_pesanan_id AND dpa.nama_obat = lp.nama_obat;
            `;
            const [historicalPrices] = await db.query(sqlRiwayatHarga, [idApotek, idPbf]);

            // 3. Buat Peta Harga (Price Map) untuk pencarian cepat
            const priceMap = historicalPrices.reduce((acc, item) => {
                acc[item.nama_obat] = parseFloat(item.harga_satuan);
                return acc;
            }, {});

            // 4. Gabungkan data stok dengan riwayat harga
            const enrichedStock = onChainStock.map(stockItem => {
                const historicalPrice = priceMap[stockItem.nama_obat];
                return {
                    ...stockItem,
                    // Prioritaskan harga riwayat jika ada, jika tidak, gunakan harga default dari PBF
                    harga_per_unit: historicalPrice !== undefined ? historicalPrice : stockItem.harga_per_unit
                };
            });

            res.json({ success: true, data: enrichedStock, source: 'on-chain-with-history' });

        } catch (error) {
            console.error(`Error fetching stock for PBF ${idPbf}:`, error.message);
            res.status(500).json({ success: false, message: 'Gagal mengambil stok dari blockchain.' });
        }
    },

    getAllPesanan: async (req, res) => {
        const idApotek = req.user.id;
        try {
            const sql = `
                SELECT 
                    pa.id,
                    pa.nomor_pesanan,
                    pa.total_harga,
                    pa.status,
                    pa.tanggal_pesanan,
                    pbf.nama_resmi AS nama_pbf
                FROM pesanan_apotek pa
                JOIN users pbf ON pa.id_pbf = pbf.id
                WHERE pa.id_apotek = ?
                ORDER BY pa.tanggal_pesanan DESC
            `;
            const [rows] = await db.query(sql, [idApotek]);
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error in getAllPesanan Apotek:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    createPesanan: async (req, res) => {
        const idApotek = req.user.id;
        const {
            id_pbf, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon,
            items, total_harga, tanda_tangan_data_url
        } = req.body;

        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            const base64Data = tanda_tangan_data_url.replace(/^data:image\/png;base64,/, "");
            const fileName = `ttd-apotek-${Date.now()}.png`;
            const filePath = path.join('uploads', 'tanda_tangan', fileName);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, base64Data, 'base64');

            const prefix = `APTK/${new Date().getFullYear()}/`;
            const [lastOrder] = await connection.query(
                "SELECT nomor_pesanan FROM pesanan_apotek WHERE nomor_pesanan LIKE ? ORDER BY id DESC LIMIT 1",
                [`${prefix}%`]
            );
            let nextSeq = 1;
            if (lastOrder.length > 0) {
                nextSeq = parseInt(lastOrder[0].nomor_pesanan.split('/').pop(), 10) + 1;
            }
            const nomor_pesanan = `${prefix}${String(nextSeq).padStart(6, '0')}`;

            const [result] = await connection.query(
                `INSERT INTO pesanan_apotek (id_apotek, id_pbf, nomor_pesanan, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon, total_harga, tanda_tangan_apoteker, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [idApotek, id_pbf, nomor_pesanan, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon, total_harga, filePath, 'Menunggu Konfirmasi']
            );
            const idPesanan = result.insertId;

            for (const item of items) {
                 // 1. Tambahkan kolom 'id_aset_blockchain' ke dalam query INSERT
            await connection.query(
                `INSERT INTO detail_pesanan_apotek (id_pesanan_apotek, id_aset_blockchain, nama_obat, keterangan, jumlah, satuan, harga_satuan)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                // 2. Tambahkan 'item.id_aset_blockchain' ke dalam array values
                [idPesanan, item.id_aset_blockchain, item.nama_obat, item.keterangan, item.qty, item.satuan, item.harga_satuan]
            );
            }

            await connection.commit();
            res.status(201).json({ success: true, message: 'Pesanan ke PBF berhasil dibuat.' });
        } catch (error) {
            if (connection) await connection.rollback();
            console.error('Error creating pesanan apotek:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
        } finally {
            if (connection) connection.release();
        }
    },

    getProfile: async (req, res) => {
        try {
            const [rows] = await db.query(
                "SELECT id, nama_resmi, alamat, email, nomor_izin FROM users WHERE id = ? AND role = 'apotek'",
                [req.user.id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Profil Apotek tidak ditemukan.' });
            }
            res.json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Error in getProfile Apotek:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    }
};

module.exports = apotekController;