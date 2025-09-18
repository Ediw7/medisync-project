'use strict';
const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Fungsi untuk menghitung hash SHA-256 dari sebuah file (jika diperlukan)
function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
}

// Fungsi helper untuk koneksi ke gateway
async function getGateway() {
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const gateway = new Gateway();
    const connectionOptions = {
        wallet,
        identity: 'admin',
        discovery: { enabled: false, asLocalhost: true },
    };
    await gateway.connect(ccp, connectionOptions);
    return gateway;
}

const pesananMasukController = {
    getAll: async (req, res) => {
        try {
            const idProdusen = req.user.id;
            const sql = `
                SELECT 
                    p.id,
                    p.nomor_po,
                    pbf.nama_resmi AS nama_pbf,
                    pbf.alamat AS alamat_pbf,
                    COALESCE(
                        (SELECT SUM(dp.total_harga) FROM detail_pesanan dp WHERE dp.id_pesanan = p.id),
                        0
                    ) AS total_harga,
                    p.status,
                    p.tanggal_pesanan
                FROM pesanan p
                JOIN users pbf ON p.id_pbf = pbf.id
                WHERE p.id_produsen = ? AND pbf.role = 'pbf'
                ORDER BY p.tanggal_pesanan DESC
            `;
            const [rows] = await db.query(sql, [idProdusen]);
            res.json({ success: true, data: rows });
        } catch (error) {
            console.error('Error in getAll pesanan masuk:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
        }
    },

    getPesananById: async (req, res) => {
        try {
            const { id } = req.params;
            const idProdusen = req.user.id;
            
            // Query ini sekarang menggabungkan pesanan dengan surat jalan (jika ada)
            const sqlPesanan = `
                SELECT 
                    p.id, p.nomor_po, p.total_harga, p.status, p.tanggal_pesanan,
                    p.catatan_khusus AS alasan_pembatalan,
                    p.updated_at AS tanggal_pengajuan_pembatalan,
                    pbf.nama_resmi AS nama_pbf,
                    sjp.nomor_surat_jalan
                FROM pesanan p
                JOIN users pbf ON p.id_pbf = pbf.id
                LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
                WHERE p.id = ? AND p.id_produsen = ?
            `;
            const [pesanan] = await db.query(sqlPesanan, [id, idProdusen]);

            if (pesanan.length === 0) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
            }

            // Query untuk detail item tetap sama
            const sqlDetail = `SELECT dp.*, pr.batch_id FROM detail_pesanan dp JOIN produksi pr ON dp.id_produksi = pr.id WHERE dp.id_pesanan = ?`;
            const [detail] = await db.query(sqlDetail, [id]);

            res.json({
                success: true,
                data: {
                    pesanan: pesanan[0],
                    detail_pesanan: detail,
                },
            });
        } catch (error) {
            console.error('Error in getPesananById:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
        }
    },

getSuratJalanById: async (req, res) => {
        try {
            const { id } = req.params; // id di sini adalah id_pesanan
            const idProdusen = req.user.id;

            // 1. Query untuk mengambil data gabungan
            const sqlPesanan = `
                SELECT 
                    p.id AS pesanan_id, p.nomor_po, p.tanggal_pesanan, p.status, p.total_harga,
                    p.nama_pbf, p.alamat_pbf, p.kontak_telepon, p.kontak_email, p.nama_apoteker, p.nomor_sipa,
                    
                    p.catatan_khusus, -- <<< INI PERBAIKANNYA (untuk alasan pembatalan)
                    
                    produsen.nama_resmi AS nama_produsen, produsen.alamat AS alamat_produsen,
                    sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, 
                    sjp.waktu_pengiriman, sjp.opsi_pengiriman, sjp.status_blockchain
                FROM pesanan p
                JOIN users pbf ON p.id_pbf = pbf.id
                JOIN users produsen ON p.id_produsen = produsen.id
                LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
                WHERE p.id = ? AND p.id_produsen = ?
            `;
            const [pesananRows] = await db.query(sqlPesanan, [id, idProdusen]);

            if (pesananRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Data pesanan atau surat jalan tidak ditemukan.' });
            }

            // 2. Query untuk mengambil detail item pesanan (Gunakan LEFT JOIN untuk keamanan)
            const sqlDetail = `
                SELECT dp.*, pr.batch_id
                FROM detail_pesanan dp
                LEFT JOIN produksi pr ON dp.id_produksi = pr.id
                WHERE dp.id_pesanan = ?
            `;
            const [detailRows] = await db.query(sqlDetail, [id]);

            // 3. Gabungkan hasilnya
            const responseData = {
                pesanan: pesananRows[0],
                detail_pesanan: detailRows
            };

            res.json({ success: true, data: responseData });

        } catch (error) {
            console.error('Error in getSuratJalanById:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
        }
    },


    
     
     updateStatus: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body; // status bisa 'Dibatalkan' atau 'Perlu Dikirim'
        const idProdusen = req.user.id;
        
        let dbConnection;
        try {
            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();

            // Cek dulu apakah pesanan ini memang sedang menunggu konfirmasi pembatalan
            const [pesanan] = await dbConnection.query(
                "SELECT id FROM pesanan WHERE id = ? AND id_produsen = ? AND status = 'Pembatalan Diajukan'",
                [id, idProdusen]
            );

            if (pesanan.length === 0) {
                throw new Error('Pesanan ini tidak dalam status menunggu konfirmasi pembatalan.');
            }

            // Jika produsen menyetujui pembatalan ('Dibatalkan')
            if (status === 'Dibatalkan') {
                // Kembalikan stok yang sudah dikurangi
                const [items] = await dbConnection.query("SELECT id_produksi, jumlah_pesanan FROM detail_pesanan WHERE id_pesanan = ?", [id]);
                for (const item of items) {
                    await dbConnection.query("UPDATE produksi SET jumlah = jumlah + ? WHERE id = ?", [item.jumlah_pesanan, item.id_produksi]);
                }
            } else if (status !== 'Perlu Dikirim') {
                // Jika statusnya bukan 'Dibatalkan', harus 'Perlu Dikirim' (menolak pembatalan)
                throw new Error("Aksi tidak valid. Pilihan hanya 'Dibatalkan' atau 'Perlu Dikirim'.");
            }

            // Update status pesanan
            const [result] = await dbConnection.query(
                `UPDATE pesanan SET status = ? WHERE id = ?`,
                [status, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('Gagal memperbarui status pesanan.');
            }

            await dbConnection.commit();
            res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status}.` });

        } catch (error) {
            if (dbConnection) await dbConnection.rollback();
            console.error('Error in updateStatus:', error);
            res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
        } finally {
            if (dbConnection) dbConnection.release();
        }
    },
    updateStatusWithDetails: async (req, res) => {
        try {
            console.log('Request params:', req.params);
            console.log('Request body:', req.body);
            const { id } = req.params;
            const { status, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman, catatan, hashSuratJalan, opsiPengiriman } = req.body;
            const idProdusen = req.user.id;
            
            // Status yang diterima dari frontend HARUS 'Dikirim'
            if (status !== 'Dikirim') {
                 return res.status(400).json({ success: false, message: 'Status tidak valid untuk atur pengiriman. Gunakan: Dikirim' });
            }

            if (!tanggalPengiriman || !nomorResi || !nomorSuratJalan || !alamatTujuan) {
                return res.status(400).json({ success: false, message: 'Tanggal pengiriman, nomor resi, nomor surat jalan, dan alamat tujuan wajib diisi.' });
            }

            const tanggalPengirimanDate = new Date(tanggalPengiriman);
            if (isNaN(tanggalPengirimanDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Format tanggal pengiriman tidak valid.' });
            }

            const opsi = opsiPengiriman?.toLowerCase() || 'standar';

            const [existing] = await db.query('SELECT id FROM pesanan WHERE id = ? AND id_produsen = ?', [id, idProdusen]);
            if (existing.length === 0) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
            }

            // Simpan ke tabel surat_jalan_produsen
            const sqlSuratJalan = `
                INSERT INTO surat_jalan_produsen (id_pesanan, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, waktu_pengiriman, catatan, hash_surat_jalan, opsi_pengiriman, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    nomor_resi = VALUES(nomor_resi),
                    nomor_surat_jalan = VALUES(nomor_surat_jalan),
                    tanggal_pengiriman = VALUES(tanggal_pengiriman),
                    alamat_tujuan = VALUES(alamat_tujuan),
                    waktu_pengiriman = VALUES(waktu_pengiriman),
                    catatan = VALUES(catatan),
                    hash_surat_jalan = VALUES(hash_surat_jalan),
                    opsi_pengiriman = VALUES(opsi_pengiriman)
            `;
            await db.query(sqlSuratJalan, [id, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman || null, catatan || null, hashSuratJalan || null, opsi]);

            // Update status di tabel pesanan menjadi 'Dikirim'
            const [result] = await db.query(
                `UPDATE pesanan SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND id_produsen = ?`,
                [status, id, idProdusen] // Status 'Dikirim'
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Gagal memperbarui status pesanan.' });
            }

            // Kurangi jumlah stok di tabel produksi (OFF-CHAIN)
            const [detailRows] = await db.query(
                `SELECT dp.id_produksi, pr.batch_id, dp.jumlah_pesanan
                 FROM detail_pesanan dp
                 JOIN produksi pr ON dp.id_produksi = pr.id
                 WHERE dp.id_pesanan = ?`,
                [id]
            );

            for (const row of detailRows) {
                await db.query(
                    `UPDATE produksi SET jumlah = jumlah - ? WHERE id = ? AND id_produsen = ?`,
                    [row.jumlah_pesanan, row.id_produksi, idProdusen]
                );
            }

            // Panggil recordToBlockchain secara otomatis
            // Fungsi ini sekarang HANYA akan mencatat ke blockchain, tidak mengubah status lagi.
            await pesananMasukController.recordToBlockchainForShipment(req, res);
            return; // Hentikan eksekusi

        } catch (error) {
            console.error('Error in updateStatusWithDetails:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
        }
    },

    recordToBlockchainForShipment: async (req, res) => {
        const { id } = req.params; // id_pesanan
        const idProdusen = req.user.id;
        let gateway;
        let dbConnection;

        try {
            dbConnection = await db.getConnection();
            const [rows] = await dbConnection.query(
                `SELECT p.id, p.nomor_po, sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, sjp.alamat_tujuan, sjp.waktu_pengiriman, sjp.catatan, sjp.hash_surat_jalan, sjp.opsi_pengiriman, pbf.id as id_pbf
                 FROM pesanan p
                 JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
                 JOIN users pbf ON p.id_pbf = pbf.id
                 WHERE p.id = ? AND p.id_produsen = ?`,
                [id, idProdusen]
            );

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Data pengiriman tidak ditemukan.' });
            }

            const shipmentData = rows[0];

            // Cek status di DB, harus 'Dikirim' (sudah di-set oleh updateStatusWithDetails)
            const [pesanan] = await dbConnection.query('SELECT status FROM pesanan WHERE id = ? AND id_produsen = ?', [id, idProdusen]);
            if (pesanan.length === 0 || pesanan[0].status !== 'Dikirim') {
                return res.status(400).json({ success: false, message: 'Hanya pesanan dengan status Dikirim yang bisa dicatat ke blockchain.' });
            }

            const [detailRows] = await dbConnection.query(
                `SELECT dp.id_produksi, pr.batch_id, dp.jumlah_pesanan
                 FROM detail_pesanan dp
                 JOIN produksi pr ON dp.id_produksi = pr.id
                 WHERE dp.id_pesanan = ?`,
                [id]
            );

            if (detailRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tidak ada obat terkait dengan pesanan ini.' });
            }

            const obatIds = detailRows.map(row => row.batch_id).filter(Boolean);
            const jumlahPesanan = detailRows.map(row => ({ obatId: row.batch_id, jumlah: row.jumlah_pesanan }));

            if (obatIds.length === 0) {
                return res.status(404).json({ success: false, message: 'Tidak ada ID batch obat yang valid untuk pesanan ini.' });
            }

            gateway = await getGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            const [pbfData] = await dbConnection.query('SELECT nama_resmi FROM users WHERE id = ?', [shipmentData.id_pbf]);
            const namaPbf = pbfData[0].nama_resmi;

            const transaction = contract.createTransaction('ProdusenContract:transferToPbf');
            transaction.setEndorsingOrganizations('ProdusenMSP', 'PBFMSP');

            console.log('Submitting ON-CHAIN transaction for shipment:', shipmentData.nomor_surat_jalan, 'with obatIds:', obatIds, 'jumlahPesanan:', jumlahPesanan);

            const args = [
                id.toString(), // idPesanan (pastikan string)
                shipmentData.hash_surat_jalan || 'TIDAK ADA HASH',
                namaPbf,
                JSON.stringify(obatIds),
                JSON.stringify(jumlahPesanan),
            ];

            await transaction.submit(...args);
            console.log('ON-CHAIN transaction for shipment successful!');

            
            await dbConnection.query('UPDATE surat_jalan_produsen SET status_blockchain = ? WHERE id_pesanan = ?', ['Tercatat', id]);

            res.json({
                success: true,
                message: `Pengiriman ${shipmentData.nomor_surat_jalan} berhasil dicatat ke blockchain. Status pesanan sekarang 'Dikirim'.`,
            });
        } catch (error) {
            console.error('Error recording shipment to blockchain:', error);
            res.status(500).json({ success: false, message: `Gagal mencatat pengiriman ke blockchain: ${error.message}` });
        } finally {
            if (gateway) gateway.disconnect();
            if (dbConnection) dbConnection.release();
        }
    },
};

module.exports = pesananMasukController;