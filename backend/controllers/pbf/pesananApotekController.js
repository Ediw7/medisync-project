'use strict';
const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Fungsi helper untuk koneksi ke Fabric Gateway
async function getPbfGateway() {
  const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json'); // Gunakan koneksi PBF (Org2)
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const gateway = new Gateway();
  // Gunakan identitas PBF, pastikan 'pbfUser' ada di wallet Anda
  await gateway.connect(ccp, { wallet, identity: 'pbfAdmin', discovery: { enabled: true, asLocalhost: true } }); 
  return gateway;
}



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

     // --- FUNGSI BARU: Untuk halaman SuratJalanPbf.jsx ---
    getSuratJalanById: async (req, res) => {
        const { id } = req.params;
        const idPbf = req.user.id;
        try {
            const sqlPesanan = `
                SELECT 
                    pa.id AS pesanan_id, pa.nomor_pesanan, pa.tanggal_pesanan, pa.status, pa.total_harga,
                    pa.nama_apotek, pa.alamat_apotek, pa.telepon AS kontak_telepon,
                    pbf.nama_resmi AS nama_pbf, pbf.alamat AS alamat_pbf,
                    sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, 
                    sjp.waktu_pengiriman, sjp.opsi_pengiriman, sjp.status_blockchain
                FROM pesanan_apotek pa
                JOIN users pbf ON pa.id_pbf = pbf.id
                LEFT JOIN surat_jalan_pbf sjp ON pa.id = sjp.id_pesanan_apotek
                WHERE pa.id = ? AND pa.id_pbf = ?
            `;
            const [pesananRows] = await db.query(sqlPesanan, [id, idPbf]);

            if (pesananRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Data pesanan atau surat jalan tidak ditemukan.' });
            }

            const sqlDetail = `
                SELECT * FROM detail_pesanan_apotek WHERE id_pesanan_apotek = ?
            `;
            const [detailRows] = await db.query(sqlDetail, [id]);

            res.json({ 
                success: true, 
                data: {
                    pesanan: pesananRows[0],
                    detail_pesanan: detailRows
                } 
            });
        } catch (error) {
            console.error('Error in getSuratJalanById (PBF):', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    // --- FUNGSI BARU: Untuk halaman LihatStatusApotek.jsx ---
    getLacakPengirimanApotek: async (req, res) => {
        // Mirip dengan getSuratJalanById tapi bisa disesuaikan jika ada info tracking tambahan
        const { id } = req.params;
        const idPbf = req.user.id;
        try {
            const sql = `
                SELECT 
                    pa.id, pa.status, pa.tanggal_pesanan,
                    sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, sjp.waktu_pengiriman, sjp.opsi_pengiriman,
                    apotek.nama_resmi AS nama_apotek_penerima,
                    pbf.nama_resmi AS nama_pbf_pengirim
                FROM pesanan_apotek pa
                JOIN users apotek ON pa.id_apotek = apotek.id
                JOIN users pbf ON pa.id_pbf = pbf.id
                LEFT JOIN surat_jalan_pbf sjp ON pa.id = sjp.id_pesanan_apotek
                WHERE pa.id = ? AND pa.id_pbf = ?
            `;
            const [rows] = await db.query(sql, [id, idPbf]);

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Data pelacakan tidak ditemukan.' });
            }

            res.json({ success: true, data: rows[0] });
        } catch (error) {
            console.error('Error in getLacakPengirimanApotek:', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    
// --- FUNGSI INI DIROMBAK TOTAL ---
    updateStatusAndCreateSuratJalan: async (req, res) => {
        const { id } = req.params; // id_pesanan_apotek
        const { status, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman, catatan, hashSuratJalan, opsiPengiriman } = req.body;
        const idPbf = req.user.id;

        let gateway;
        let dbConnection;

        try {
            // Langkah 1: Validasi Input
            if (status !== 'Dikirim') {
                return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan: Dikirim' });
            }
            if (!tanggalPengiriman || !nomorResi || !nomorSuratJalan || !alamatTujuan) {
                return res.status(400).json({ success: false, message: 'Data surat jalan wajib diisi lengkap.' });
            }

            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();

            // Langkah 2: Proses Database Off-Chain (MySQL)
            const [existing] = await dbConnection.query('SELECT id, id_apotek, nama_apotek FROM pesanan_apotek WHERE id = ? AND id_pbf = ? AND status = "Perlu Dikirim"', [id, idPbf]);
            if (existing.length === 0) {
                throw new Error('Pesanan tidak ditemukan atau statusnya bukan "Perlu Dikirim".');
            }

            const sqlSuratJalan = `
                INSERT INTO surat_jalan_pbf (id_pesanan_apotek, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, waktu_pengiriman, catatan, hash_surat_jalan, opsi_pengiriman)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    nomor_resi = VALUES(nomor_resi), nomor_surat_jalan = VALUES(nomor_surat_jalan), tanggal_pengiriman = VALUES(tanggal_pengiriman),
                    alamat_tujuan = VALUES(alamat_tujuan), waktu_pengiriman = VALUES(waktu_pengiriman), catatan = VALUES(catatan),
                    hash_surat_jalan = VALUES(hash_surat_jalan), opsi_pengiriman = VALUES(opsi_pengiriman)`;
            
            await dbConnection.query(sqlSuratJalan, [id, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman || null, catatan || null, hashSuratJalan || null, opsiPengiriman?.toLowerCase() || 'standar']);
            
            const [detailRows] = await dbConnection.query(
                `SELECT dp.id as detail_pesanan_id, dp.id_aset_blockchain, dp.jumlah
                 FROM detail_pesanan_apotek dp
                 WHERE dp.id_pesanan_apotek = ?`, [id]
            );

            if (detailRows.length === 0) {
                throw new Error('Tidak ada detail obat yang ditemukan untuk pesanan ini.');
            }

            const obatIds = detailRows.map(row => row.id_aset_blockchain).filter(Boolean);
            const jumlahPesanan = detailRows.map(row => ({ obatId: row.id_aset_blockchain, jumlah: row.jumlah }));

            if (obatIds.length === 0) {
                throw new Error('Tidak ada ID aset blockchain yang valid untuk pesanan ini. Pastikan stok sudah dipilih dari blockchain.');
            }
            
            // Langkah 3: Proses On-Chain (Hyperledger Fabric)
            gateway = await getPbfGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            const namaApotek = existing[0].nama_apotek;

            console.log('Submitting ON-CHAIN transaction for shipment to Apotek:', nomorSuratJalan);
            const transaction = contract.createTransaction('PbfContract:transferToApotek');
            
            const resultBuffer = await transaction.submit(
                id.toString(),
                hashSuratJalan || 'TIDAK_ADA_HASH',
                namaApotek,
                JSON.stringify(obatIds),
                JSON.stringify(jumlahPesanan)
            );

            const resultJson = JSON.parse(resultBuffer.toString());
            const createdAssetIds = resultJson.createdAssetIds;
            console.log('ON-CHAIN transaction successful! New asset IDs:', createdAssetIds);

            // Langkah 4: Simpan ID Aset Blockchain BARU ke MySQL
            // Ini penting agar apotek bisa menerima barang dengan ID yang benar
            if (createdAssetIds && createdAssetIds.length > 0) {
                for (const assetId of createdAssetIds) {
                    const originalAsetId = assetId.substring(0, assetId.lastIndexOf(`-${id}`));
                    const correspondingDetail = detailRows.find(d => d.id_aset_blockchain === originalAsetId);
                    if (correspondingDetail) {
                        await dbConnection.query(
                            // Update id_aset_blockchain di detail pesanan apotek dengan ID baru hasil splitting
                            'UPDATE detail_pesanan_apotek SET id_aset_blockchain = ? WHERE id = ?',
                            [assetId, correspondingDetail.detail_pesanan_id]
                        );
                        console.log(`Updated detail_pesanan_apotek ID ${correspondingDetail.detail_pesanan_id} with NEW blockchain asset ID ${assetId}`);
                    }
                }
            }
            
            // Langkah 5: Finalisasi Update di MySQL
            await dbConnection.query('UPDATE surat_jalan_pbf SET status_blockchain = ? WHERE id_pesanan_apotek = ?', ['Tercatat', id]);
            await dbConnection.query('UPDATE pesanan_apotek SET status = ? WHERE id = ?', [status, id]);
            
            await dbConnection.commit();
            
            res.json({ success: true, message: `Pesanan berhasil dikirim dan dicatat ke blockchain.` });

        } catch (error) {
            console.error('Error in updateStatusAndCreateSuratJalan:', error);
            if (dbConnection) await dbConnection.rollback();
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
        } finally {
            if (gateway) gateway.disconnect();
            if (dbConnection) dbConnection.release();
        }
    },

    prosesPesanan: async (req, res) => {
        const { id } = req.params;
        const idPbf = req.user.id;

        try {
            const [pesanan] = await db.query(
                'SELECT * FROM pesanan_apotek WHERE id = ? AND id_pbf = ? AND status = "Menunggu Konfirmasi"',
                [id, idPbf]
            );

            if (pesanan.length === 0) {
                return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau sudah diproses.' });
            }

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