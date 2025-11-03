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
                [idApotek, id_pbf, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon, total_harga, 'Perlu Dikirim']
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
            // --- PERBAIKAN DI SINI ---
            // Tambahkan subquery untuk mengambil satu id_aset_blockchain
            const sql = `
                SELECT 
                    pa.*,
                    (SELECT dp.id_aset_blockchain 
                     FROM detail_pesanan_apotek dp 
                     WHERE dp.id_pesanan_apotek = pa.id AND dp.id_aset_blockchain IS NOT NULL
                     LIMIT 1) AS id_aset_blockchain
                FROM pesanan_apotek pa 
                WHERE pa.id_pbf = ? 
                ORDER BY pa.tanggal_pesanan DESC
            `;
            const [rows] = await db.query(sql, [idPbf]);
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

            const pesananData = pesananRows[0];
            let alasan_pembatalan = '-';
            // --- PERBAIKAN LOGIKA EKSTRAK ALASAN ---
            // Pisahkan alasan pengajuan (dari Apotek) dan alasan penolakan (dari PBF)
            if (pesananData.catatan_khusus) {
                const catatan = pesananData.catatan_khusus;
                
                // Cari alasan pengajuan
                const alasanApotekMatch = catatan.match(/Alasan: (.*?)(?=\n\[PENOLAKAN\]|$)/);
                if (alasanApotekMatch && alasanApotekMatch[1]) {
                    alasan_pembatalan = alasanApotekMatch[1].trim();
                }

                // Cari alasan penolakan
                const alasanPbfMatch = catatan.match(/\[PENOLAKAN\]: (.*)/);
                if (alasanPbfMatch && alasanPbfMatch[1]) {
                    pesananData.alasan_penolakan = alasanPbfMatch[1].trim(); // Tambah properti baru
                }
            }

            res.json({
                success: true,
                data: {
                    // Sertakan alasan pembatalan ke dalam objek pesanan
                    pesanan: { ...pesananData, alasan_pembatalan },
                    detail_pesanan: detailRows,
                },
            });
        } catch (error) {
            console.error(`Error getting pesanan apotek by ID ${id}:`, error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    requestPembatalan: async (req, res) => {
        const { id } = req.params;
        const { alasan } = req.body;
        const idApotek = req.user.id;

        if (!alasan) {
            return res.status(400).json({ success: false, message: 'Alasan pembatalan wajib diisi.' });
        }

        try {
            const [pesanan] = await db.query(
                "SELECT id FROM pesanan_apotek WHERE id = ? AND id_apotek = ? AND status = 'Perlu Dikirim'",
                [id, idApotek]
            );

            if (pesanan.length === 0) {
                return res.status(403).json({ success: false, message: "Pesanan tidak dapat dibatalkan atau tidak ditemukan. Status harus 'Perlu Dikirim'." });
            }
            
            await db.query(
                "UPDATE pesanan_apotek SET status = 'Pembatalan Diajukan', catatan_khusus = ? WHERE id = ?",
                [`Dibatalkan oleh Apotek. Alasan: ${alasan}`, id]
            );

            res.json({ success: true, message: "Pengajuan pembatalan berhasil dikirim." });
        } catch (error) {
            console.error('Error in requestPembatalan (Apotek):', error);
            res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
        }
    },

    konfirmasiPembatalan: async (req, res) => {
        const { id } = req.params;
        // Ambil status DAN alasan_penolakan dari body
        const { status, alasan_penolakan } = req.body; 
        const idPbf = req.user.id;

        let dbConnection;
        try {
            dbConnection = await db.getConnection();
            await dbConnection.beginTransaction();

            const [currentPesanan] = await dbConnection.query(
                "SELECT status, catatan_khusus FROM pesanan_apotek WHERE id = ? AND id_pbf = ?", // Ambil catatan_khusus
                [id, idPbf]
            );

            if (currentPesanan.length === 0) {
                throw new Error('Pesanan tidak ditemukan atau Anda tidak berwenang.');
            }

            if (currentPesanan[0].status !== 'Pembatalan Diajukan') {
                throw new Error("Aksi tidak valid. Pesanan tidak dalam status 'Pembatalan Diajukan'.");
            }

            // Logika baru yang mirip dengan Produsen
            if (status === 'Dibatalkan') {
                // Jika Dibatalkan, cukup update status
                await dbConnection.query(`UPDATE pesanan_apotek SET status = ? WHERE id = ?`, [status, id]);
            
            } else if (status === 'Pembatalan Ditolak') {
                // Jika Ditolak, WAJIB ada alasan
                if (!alasan_penolakan || alasan_penolakan.trim() === '') {
                    throw new Error('Alasan penolakan wajib diisi saat menolak pembatalan.');
                }
                // Tambahkan alasan penolakan ke catatan_khusus
                const catatanBaru = (currentPesanan[0].catatan_khusus || '') + `\n[PENOLAKAN]: ${alasan_penolakan}`;
                await dbConnection.query(`UPDATE pesanan_apotek SET status = ?, catatan_khusus = ? WHERE id = ?`, [status, catatanBaru, id]);

            } else {
                // Status tidak valid
                throw new Error("Status tujuan hanya bisa 'Dibatalkan' atau 'Pembatalan Ditolak'.");
            }
            
            await dbConnection.commit();

            res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status}.` });

        } catch (error) {
            if (dbConnection) await dbConnection.rollback();
            console.error('Error in konfirmasiPembatalan (PBF):', error);
            res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
        } finally {
            if (dbConnection) dbConnection.release();
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


    prosesPengirimanMassal: async (req, res) => {
        const { selectedIds, tanggalPengiriman, waktuPengiriman, catatan, opsiPengiriman } = req.body;
        const idPbf = req.user.id;

        if (!selectedIds || selectedIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada pesanan yang dipilih.' });
        }

        let gateway;
        let dbConnection;
        const processedDetails = [];
        const errors = [];

        try {
            dbConnection = await db.getConnection();
            gateway = await getPbfGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            for (const pesananId of selectedIds) {
                try {
                    await dbConnection.beginTransaction();

                    const [pesanan] = await dbConnection.query(
                      'SELECT id, id_apotek, nama_apotek, nomor_pesanan, alamat_apotek FROM pesanan_apotek WHERE id = ? AND id_pbf = ? AND status = "Perlu Dikirim" FOR UPDATE',
                      [pesananId, idPbf]
                    );

                    if (pesanan.length === 0) {
                        throw new Error(`Pesanan tidak ditemukan atau statusnya bukan "Perlu Dikirim".`);
                    }
                    
                    const timestamp = Date.now();
                    const nomorResi = `RES-${timestamp}-${pesananId}`;
                    const nomorSuratJalan = `SJ-${timestamp}-${pesananId}`;
                    const hashSuratJalan = `HASH_SJPBF_${timestamp}_${pesananId}`;

                    await dbConnection.query(
                      `INSERT INTO surat_jalan_pbf (id_pesanan_apotek, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, waktu_pengiriman, catatan, hash_surat_jalan, opsi_pengiriman)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [pesananId, nomorResi, nomorSuratJalan, tanggalPengiriman, pesanan[0].alamat_apotek, waktuPengiriman || null, catatan || null, hashSuratJalan, opsiPengiriman]
                    );
                    
                    const [detailRows] = await dbConnection.query(
                        `SELECT dp.id as detail_pesanan_id, dp.id_aset_blockchain, dp.jumlah, dp.nama_obat, dp.harga_satuan FROM detail_pesanan_apotek dp WHERE dp.id_pesanan_apotek = ?`, [pesananId]
                    );

                    if (detailRows.length === 0) throw new Error(`Detail pesanan tidak ditemukan.`);
                    
                    const obatIds = detailRows.map(row => row.id_aset_blockchain).filter(Boolean);
                    const jumlahPesanan = detailRows.map(row => ({ obatId: row.id_aset_blockchain, jumlah: row.jumlah }));

                    const transaction = contract.createTransaction('PbfContract:transferToApotek');
                    const resultBuffer = await transaction.submit(
                        pesananId.toString(), hashSuratJalan, pesanan[0].nama_apotek,
                        JSON.stringify(obatIds), JSON.stringify(jumlahPesanan)
                    );

                    const resultJson = JSON.parse(resultBuffer.toString());
                    const createdAssetIds = resultJson.createdAssetIds;

                    if (createdAssetIds && createdAssetIds.length > 0) {
                        for (const assetId of createdAssetIds) {
                            const originalAsetId = assetId.substring(0, assetId.lastIndexOf(`-${pesananId}`));
                            const correspondingDetail = detailRows.find(d => d.id_aset_blockchain === originalAsetId);
                            if (correspondingDetail) {
                                await dbConnection.query(
                                    'UPDATE detail_pesanan_apotek SET id_aset_blockchain = ? WHERE id = ?',
                                    [assetId, correspondingDetail.detail_pesanan_id]
                                );
                            }
                        }
                    }

                    await dbConnection.query('UPDATE surat_jalan_pbf SET status_blockchain = ? WHERE id_pesanan_apotek = ?', ['Tercatat', pesananId]);
                    await dbConnection.query('UPDATE pesanan_apotek SET status = ? WHERE id = ?', ['Dikirim', pesananId]);
                    
                    await dbConnection.commit();

                    processedDetails.push({
                        ...pesanan[0],
                        nomorResi,
                        nomorSuratJalan,
                        detail_pesanan: detailRows,
                    });

                } catch (innerError) {
                    await dbConnection.rollback();
                    errors.push(`Gagal memproses Pesanan ID ${pesananId}: ${innerError.message}`);
                }
            } // Loop selesai

            if (errors.length > 0) {
                return res.status(207).json({ 
                    success: false, 
                    message: `Beberapa pesanan gagal diproses.`, 
                    data: processedDetails,
                    errors: errors
                });
            }

            res.json({ success: true, message: 'Semua pesanan berhasil diproses.', data: processedDetails });

        } catch (outerError) {
            console.error('Error in prosesPengirimanMassal (Outer):', outerError);
            res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${outerError.message}` });
        } finally {
            if (gateway) gateway.disconnect();
            if (dbConnection) dbConnection.release();
        }
    },

    approvePengembalianApotek: async (req, res) => {
    const { id } = req.params; // ID Pesanan Apotek
    const idPbf = req.user.id;
    let dbConnection;

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      const [pesanan] = await dbConnection.query(
        "SELECT id FROM pesanan_apotek WHERE id = ? AND id_pbf = ? AND status = 'Pengembalian Diajukan'",
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        throw new Error('Pesanan tidak ditemukan atau tidak dalam status pengajuan pengembalian.');
      }

      // Update status
      await dbConnection.query(
        "UPDATE pesanan_apotek SET status = 'Pengembalian Disetujui' WHERE id = ?",
        [id]
      );
      
      await dbConnection.commit();
      res.json({ success: true, message: 'Pengajuan pengembalian telah disetujui.' });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in approvePengembalianApotek:', error);
      res.status(500).json({ success: false, message: error.message || 'Kesalahan Server Internal' });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  // --- FUNGSI BARU UNTUK MENOLAK ---
  rejectPengembalianApotek: async (req, res) => {
    const { id } = req.params; // ID Pesanan Apotek
    const { alasan_penolakan } = req.body;
    const idPbf = req.user.id;
    let dbConnection;

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      if (!alasan_penolakan || alasan_penolakan.trim() === '') {
        throw new Error('Alasan penolakan wajib diisi.');
      }

      const [pesanan] = await dbConnection.query(
        "SELECT id, catatan_khusus FROM pesanan_apotek WHERE id = ? AND id_pbf = ? AND status = 'Pengembalian Diajukan'",
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        throw new Error('Pesanan tidak ditemukan atau tidak dalam status pengajuan pengembalian.');
      }

      const catatanLama = pesanan[0].catatan_khusus || '';
      const catatanBaru = catatanLama + `\n[PENOLAKAN PENGEMBALIAN]: ${alasan_penolakan}`;
      
      await dbConnection.query(
        "UPDATE pesanan_apotek SET status = 'Pengembalian Ditolak', catatan_khusus = ? WHERE id = ?",
        [catatanBaru, id]
      );

      await dbConnection.commit();
      res.json({ success: true, message: 'Pengajuan pengembalian telah ditolak.' });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in rejectPengembalianApotek:', error);
      res.status(500).json({ success: false, message: error.message || 'Kesalahan Server Internal' });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },
  
};

module.exports = pesananApotekController;