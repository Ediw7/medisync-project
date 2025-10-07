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
  await gateway.connect(ccp, { wallet, identity: 'pbfUser', discovery: { enabled: true, asLocalhost: true } });
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

    updateStatusAndCreateSuratJalan: async (req, res) => {
        const { id } = req.params; // id_pesanan_apotek
        const { status, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman, catatan, hashSuratJalan, opsiPengiriman } = req.body;
        const idPbf = req.user.id;

        let gateway;
        let dbConnection;

        try {
            // --- Langkah 1: Validasi Input ---
            if (status !== 'Dikirim') {
                return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan: Dikirim' });
            }
            if (!tanggalPengiriman || !nomorResi || !nomorSuratJalan || !alamatTujuan) {
                return res.status(400).json({ success: false, message: 'Data surat jalan wajib diisi lengkap.' });
            }

            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();

            // --- Langkah 2: Proses Database Off-Chain (MySQL) ---
            const [existing] = await dbConnection.query('SELECT id, id_apotek, nama_apotek FROM pesanan_apotek WHERE id = ? AND id_pbf = ?', [id, idPbf]);
            if (existing.length === 0) {
                throw new Error('Pesanan tidak ditemukan atau Anda tidak memiliki akses.');
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
                throw new Error('Tidak ada ID aset blockchain yang valid untuk pesanan ini.');
            }
            
            // --- Langkah 3: Proses On-Chain (Hyperledger Fabric) ---
            gateway = await getPbfGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            const namaApotek = existing[0].nama_apotek;

            console.log('Submitting ON-CHAIN transaction for shipment:', nomorSuratJalan);
            const transaction = contract.createTransaction('PbfContract:transferToApotek');
            
            const resultBuffer = await transaction.submit(
                id.toString().padStart(6, '0'), // Pastikan ID pesanan sesuai format
                hashSuratJalan || 'TIDAK_ADA_HASH',
                namaApotek,
                JSON.stringify(obatIds),
                JSON.stringify(jumlahPesanan)
            );

            const resultJson = JSON.parse(resultBuffer.toString());
            const createdAssetIds = resultJson.createdAssetIds;
            console.log('ON-CHAIN transaction successful! New asset IDs:', createdAssetIds);

            // --- Langkah 4: Simpan ID Aset Blockchain ke MySQL ---
            if (createdAssetIds && createdAssetIds.length > 0) {
                for (const assetId of createdAssetIds) {
                    // Ekstrak aset ID asli dari ID aset baru (asumsi format 'asetId-pesananId')
                    const originalAsetId = assetId.substring(0, assetId.lastIndexOf('-')); 
                    const correspondingDetail = detailRows.find(d => d.id_aset_blockchain === originalAsetId);
                    if (correspondingDetail) {
                        await dbConnection.query(
                            'UPDATE detail_pesanan_apotek SET id_aset_blockchain = ? WHERE id = ?',
                            [assetId, correspondingDetail.detail_pesanan_id]
                        );
                        console.log(`Updated detail_pesanan_apotek ID ${correspondingDetail.detail_pesanan_id} with blockchain asset ID ${assetId}`);
                    }
                }
            }
            
            // --- Langkah 5: Finalisasi Update di MySQL ---
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
updateStatusAndCreateSuratJalan: async (req, res) => {
        const { id } = req.params; // id_pesanan_apotek
        const {
            status, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan,
            waktuPengiriman, catatan, hashSuratJalan, opsiPengiriman
        } = req.body;
        const idPbf = req.user.id;

        let dbConnection;
        let gateway;

        try {
            if (status !== 'Dikirim') {
                return res.status(400).json({ success: false, message: 'Status tidak valid.' });
            }

            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();

            // 1. Verifikasi pesanan
            const [pesanan] = await dbConnection.query(
                'SELECT id FROM pesanan_apotek WHERE id = ? AND id_pbf = ? AND status = "Perlu Dikirim"',
                [id, idPbf]
            );
            if (pesanan.length === 0) {
                throw new Error('Pesanan tidak ditemukan atau tidak dalam status "Perlu Dikirim".');
            }

            // 2. Simpan/Update data surat jalan ke tabel surat_jalan_pbf
            const sqlSuratJalan = `
                INSERT INTO surat_jalan_pbf (id_pesanan_apotek, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, waktu_pengiriman, catatan, hash_surat_jalan, opsi_pengiriman)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    nomor_resi=VALUES(nomor_resi), nomor_surat_jalan=VALUES(nomor_surat_jalan), tanggal_pengiriman=VALUES(tanggal_pengiriman),
                    alamat_tujuan=VALUES(alamat_tujuan), waktu_pengiriman=VALUES(waktu_pengiriman), catatan=VALUES(catatan), 
                    hash_surat_jalan=VALUES(hash_surat_jalan), opsi_pengiriman=VALUES(opsi_pengiriman)
            `;
            await dbConnection.query(sqlSuratJalan, [id, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman, catatan, hashSuratJalan, opsiPengiriman]);

            // 3. Panggil Chaincode untuk transfer ke Apotek
            const [detailPesanan] = await dbConnection.query(
                'SELECT id_aset_blockchain FROM detail_pesanan_apotek WHERE id_pesanan_apotek = ?', [id]
            );
            
            if (detailPesanan.length === 0 || !detailPesanan[0].id_aset_blockchain) {
                throw new Error('Aset blockchain untuk pesanan ini tidak ditemukan.');
            }
            const assetId = detailPesanan[0].id_aset_blockchain;

            gateway = await getPbfGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync', 'PbfContract');

            console.log(`Submitting transaction to transfer asset ${assetId} to Apotek...`);
            await contract.submitTransaction('transferToApotek', assetId, hashSuratJalan);
            console.log('Transaction has been submitted successfully.');

            // 4. Update status pesanan dan surat jalan di database
            await dbConnection.query("UPDATE surat_jalan_pbf SET status_blockchain = 'Tercatat' WHERE id_pesanan_apotek = ?", [id]);
            await dbConnection.query("UPDATE pesanan_apotek SET status = 'Dikirim' WHERE id = ?", [id]);

            await dbConnection.commit();
            res.json({ success: true, message: 'Pengiriman berhasil diatur dan dicatat ke blockchain.' });

        } catch (error) {
            if (dbConnection) await dbConnection.rollback();
            console.error('Error in updateStatusAndCreateSuratJalan:', error);
            res.status(500).json({ success: false, message: error.message || 'Kesalahan Server Internal' });
        } finally {
            if (gateway) gateway.disconnect();
            if (dbConnection) dbConnection.release();
        }
    },
};

module.exports = pesananApotekController;