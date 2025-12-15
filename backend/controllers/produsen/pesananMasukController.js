/* File: backend/controllers/produsen/pesananMasukController.js */
'use strict';

const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs'); // Untuk operasi sinkron jika perlu
const fsPromises = require('fs').promises; // Untuk operasi async
const crypto = require('crypto');

// --- HELPER FUNCTIONS ---

async function calculateFileHash(filePath) {
  try {
    const fileBuffer = await fsPromises.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error hash file:', error);
    return 'HASH_ERROR'; // Fallback jika gagal baca file
  }
}

async function getGateway() {
  const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  
  const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org1.json');
  if (!fs.existsSync(ccpPath)) {
      throw new Error(`Connection profile tidak ditemukan di: ${ccpPath}`);
  }
  const ccp = JSON.parse(await fsPromises.readFile(ccpPath, 'utf8'));
  
  const gateway = new Gateway();
  
  // GUNAKAN USER PRODUSEN YANG VALID
  const identityLabel = 'produsen_user_2'; 
  const identity = await wallet.get(identityLabel);
  if (!identity) {
      throw new Error(`Identitas "${identityLabel}" tidak ditemukan di wallet.`);
  }

  const connectionOptions = {
    wallet,
    identity: identityLabel,
    discovery: { enabled: true, asLocalhost: true },
  };
  
  await gateway.connect(ccp, connectionOptions);
  return gateway;
}

// --- CONTROLLER ---

const pesananMasukController = {

  // 1. GET ALL PESANAN MASUK
  getAll: async (req, res) => {
    try {
      const idProdusen = req.user.id;
   
      const sql = `
        SELECT 
          p.id, p.nomor_po, p.status, p.tanggal_pesanan,
          pbf.nama_resmi AS nama_pbf, pbf.alamat AS alamat_pbf,
          COALESCE(
            (SELECT SUM(dp.total_harga) FROM detail_pesanan dp WHERE dp.id_pesanan = p.id), 0
          ) AS total_harga
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        WHERE p.id_produsen = ? 
        ORDER BY p.tanggal_pesanan DESC
      `;
      const [rows] = await db.query(sql, [idProdusen]);

      // Ambil detail item ringkas untuk setiap pesanan
      const sqlDetail = `
        SELECT dp.id, dp.nama_obat, dp.jumlah_pesanan, pr.batch_id, dp.id_aset_blockchain
        FROM detail_pesanan dp
        LEFT JOIN produksi pr ON dp.id_produksi = pr.id
        WHERE dp.id_pesanan = ?
      `;

      for (const pesanan of rows) {
        const [detail] = await db.query(sqlDetail, [pesanan.id]);
        pesanan.detail_pesanan = detail; 
      }
 
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
  },

  // 2. GET MASSAL DETAILS (Untuk Checkbox Selection)
  getMassalDetails: async (req, res) => {
    const { selectedIds } = req.body;
    const idProdusen = req.user.id;

    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res.status(400).json({ success: false, message: 'selectedIds wajib array.' });
    }

    try {
      const placeholders = selectedIds.map(() => '?').join(',');
      
      const sql = `
        SELECT 
          p.id, p.nomor_po, p.status,
          u.nama_resmi AS nama_pbf, 
          u.alamat AS alamat_pbf
        FROM pesanan p
        JOIN users u ON p.id_pbf = u.id
        WHERE p.id_produsen = ? AND p.id IN (${placeholders})
      `;
      
      const params = [idProdusen, ...selectedIds];
      const [rows] = await db.query(sql, params);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
      }

      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getMassalDetails:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. GET SINGLE PESANAN DETAIL
  getPesananById: async (req, res) => {
    try {
      const { id } = req.params;
      const idProdusen = req.user.id;
      
      const sqlPesanan = `
          SELECT 
            p.*, 
            pbf.nama_resmi AS nama_pbf, pbf.alamat AS alamat_pbf,
            produsen.nama_resmi AS nama_produsen, produsen.alamat AS alamat_produsen,
            sjp.nomor_surat_jalan
          FROM pesanan p
          JOIN users pbf ON p.id_pbf = pbf.id
          JOIN users produsen ON p.id_produsen = produsen.id
          LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
          WHERE p.id = ? AND p.id_produsen = ?
        `;
      const [pesanan] = await db.query(sqlPesanan, [id, idProdusen]);
  
      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
      }
  
      const sqlDetail = `
        SELECT dp.*, pr.batch_id
        FROM detail_pesanan dp
        LEFT JOIN produksi pr ON dp.id_produksi = pr.id
        WHERE dp.id_pesanan = ?
      `;
      const [detail] = await db.query(sqlDetail, [id]);
  
      let alasan_pembatalan = '-';
      if (pesanan[0].catatan_khusus && pesanan[0].catatan_khusus.includes('Alasan:')) {
        alasan_pembatalan = pesanan[0].catatan_khusus.split('Alasan:')[1].trim();
      }
  
      res.json({
        success: true,
        data: {
          pesanan: { ...pesanan[0], alasan_pembatalan },
          detail_pesanan: detail,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. GET SURAT JALAN
  getSuratJalanById: async (req, res) => {
    try {
      const { id } = req.params;
      const idProdusen = req.user.id;
      
      const sqlPesanan = `
        SELECT 
          p.id AS pesanan_id, p.nomor_po, p.tanggal_pesanan, p.status, p.total_harga,
          p.nama_pbf, p.alamat_pbf, p.kontak_telepon, p.kontak_email, p.nama_apoteker, p.nomor_sipa,
          produsen.nama_resmi AS nama_produsen, produsen.alamat AS alamat_produsen,
          sjp.*
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        JOIN users produsen ON p.id_produsen = produsen.id
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        WHERE p.id = ? AND p.id_produsen = ?
      `;
      const [pesananRows] = await db.query(sqlPesanan, [id, idProdusen]);

      if (pesananRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
      }

      const sqlDetail = `
        SELECT dp.*, pr.batch_id
        FROM detail_pesanan dp
        JOIN produksi pr ON dp.id_produksi = pr.id
        WHERE dp.id_pesanan = ?
      `;
      const [detailRows] = await db.query(sqlDetail, [id]);

      res.json({ success: true, data: { pesanan: pesananRows[0], detail_pesanan: detailRows } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 5. GET DETAIL PENGEMBALIAN
  getDetailPengembalian: async (req, res) => {
    const { id } = req.params;
    const idProdusen = req.user.id;

    try {
      const sql = `
        SELECT p.id, p.nomor_po, p.catatan_khusus, p.bukti_foto, p.status, p.tanggal_pesanan, p.total_harga,
          pbf.nama_resmi AS nama_pbf, sjp.nomor_surat_jalan 
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        WHERE p.id = ? AND p.id_produsen = ? 
        AND (p.status = 'Pengembalian Diajukan' OR p.status = 'Dikembalikan' OR p.status = 'Pengembalian Ditolak')
      `;
      const [pesanan] = await db.query(sql, [id, idProdusen]);

      if (pesanan.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

      let alasan_pengembalian = '-';
      if (pesanan[0].catatan_khusus && pesanan[0].catatan_khusus.includes('Alasan:')) {
        alasan_pengembalian = pesanan[0].catatan_khusus.split('Alasan:')[1].split('[')[0].trim();
      }
      
      res.json({ success: true, data: { ...pesanan[0], alasan_pengembalian } });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 6. APPROVE PENGEMBALIAN
  approvePengembalian: async (req, res) => {
    const { id } = req.params;
    const idProdusen = req.user.id;
    let dbConnection;

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      const [pesanan] = await dbConnection.query(
        "SELECT id FROM pesanan WHERE id = ? AND id_produsen = ? AND status = 'Pengembalian Diajukan'",
        [id, idProdusen]
      );

      if (pesanan.length === 0) throw new Error('Pesanan tidak valid untuk disetujui.');

      await dbConnection.query("UPDATE pesanan SET status = 'Dikembalikan' WHERE id = ?", [id]);
      
      const nomorSuratJalanPulang = `SJPULANG-${Date.now()}`;
      await dbConnection.query(
        "UPDATE pesanan SET catatan_khusus = CONCAT(IFNULL(catatan_khusus, ''), ?) WHERE id = ?",
        [`\nPengembalian disetujui. No SJ Pulang: ${nomorSuratJalanPulang}`, id]
      );

      await dbConnection.commit();
      res.json({ success: true, message: 'Pengembalian disetujui.' });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      res.status(500).json({ success: false, message: error.message });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  // 7. REJECT PENGEMBALIAN
  rejectPengembalian: async (req, res) => {
    const { id } = req.params;
    const { alasan_penolakan } = req.body;
    const idProdusen = req.user.id;
    let dbConnection;

    try {
      if (!alasan_penolakan) throw new Error('Alasan penolakan wajib diisi.');

      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      const [pesanan] = await dbConnection.query(
        "SELECT id, catatan_khusus FROM pesanan WHERE id = ? AND id_produsen = ? AND status = 'Pengembalian Diajukan'",
        [id, idProdusen]
      );

      if (pesanan.length === 0) throw new Error('Pesanan tidak valid untuk ditolak.');

      const catatanBaru = (pesanan[0].catatan_khusus || '') + `\n[PENOLAKAN PENGEMBALIAN]: ${alasan_penolakan}`;
      
      await dbConnection.query(
        "UPDATE pesanan SET status = 'Pengembalian Ditolak', catatan_khusus = ? WHERE id = ?",
        [catatanBaru, id]
      );

      await dbConnection.commit();
      res.json({ success: true, message: 'Pengembalian ditolak.' });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      res.status(500).json({ success: false, message: error.message });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  // 8. LACAK PENGEMBALIAN
  getLacakPengembalian: async (req, res) => {
    const { id } = req.params;
    const idProdusen = req.user.id;

    try {
      const sql = `
        SELECT 
          p.id, p.status, p.tanggal_pesanan,
          p.bukti_foto_pengembalian,
          sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman,
          pbf.nama_resmi AS nama_pbf, produsen.nama_resmi AS nama_produsen
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        JOIN users produsen ON p.id_produsen = produsen.id
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        WHERE p.id = ? AND p.id_produsen = ?
      `;
      const [rows] = await db.query(sql, [id, idProdusen]);

      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 9. CONFIRM RETURN RECEIPT (Aset diterima kembali oleh Produsen)
  confirmReturnReceipt: async (req, res) => {
    const { id } = req.params;
    const idProdusen = req.user.id;
    const buktiFoto = req.file;
    let dbConnection;

    try {
      if (!buktiFoto) return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });

      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      const [pesanan] = await dbConnection.query(
        "SELECT id FROM pesanan WHERE id = ? AND id_produsen = ? AND status = 'Dikembalikan'",
        [id, idProdusen]
      );

      if (pesanan.length === 0) throw new Error('Pesanan tidak valid untuk konfirmasi penerimaan.');

      await dbConnection.query(
        "UPDATE pesanan SET status = 'Pengembalian Selesai', bukti_foto_pengembalian = ? WHERE id = ?",
        [buktiFoto.path, id]
      );

      // TODO: Jika ingin mengupdate Blockchain (Return Asset), panggil Chaincode di sini.
      // Saat ini kita hanya update database off-chain.

      await dbConnection.commit();
      res.json({ success: true, message: 'Penerimaan pengembalian dikonfirmasi.' });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      res.status(500).json({ success: false, message: error.message });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  // 10. UPDATE STATUS & KIRIM PESANAN (CORE FUNCTION)
  updateStatusWithDetails: async (req, res) => {
    const { id } = req.params;
    const { 
        status, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, 
        waktuPengiriman, catatanKurir, catatanPenerima, hashSuratJalan, opsiPengiriman 
    } = req.body;
    const idProdusen = req.user.id;

    let gateway;
    let dbConnection;

    try {
      if (status !== 'Dikirim') return res.status(400).json({ success: false, message: 'Status harus Dikirim.' });
      if (!nomorSuratJalan) return res.status(400).json({ success: false, message: 'Nomor Surat Jalan wajib diisi.' });

      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // Validasi Pesanan
      const [existing] = await dbConnection.query(
          'SELECT id, id_pbf, nama_pbf, nomor_po FROM pesanan WHERE id = ? AND id_produsen = ?', 
          [id, idProdusen]
      );
      if (existing.length === 0) throw new Error('Pesanan tidak ditemukan.');

      // Insert/Update Surat Jalan
      const sqlSuratJalan = `
        INSERT INTO surat_jalan_produsen (
          id_pesanan, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, 
          waktu_pengiriman, catatan_kurir, catatan_penerima, hash_surat_jalan, opsi_pengiriman
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          nomor_resi=VALUES(nomor_resi), nomor_surat_jalan=VALUES(nomor_surat_jalan), 
          tanggal_pengiriman=VALUES(tanggal_pengiriman), hash_surat_jalan=VALUES(hash_surat_jalan)`;
      
      await dbConnection.query(sqlSuratJalan, [
          id, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, 
          waktuPengiriman, catatanKurir, catatanPenerima, 
          hashSuratJalan, opsiPengiriman || 'standar'
      ]);
      
      // Ambil Item untuk Blockchain
      const [detailRows] = await dbConnection.query(
        `SELECT dp.id as detail_pesanan_id, pr.batch_id, dp.jumlah_pesanan
         FROM detail_pesanan dp JOIN produksi pr ON dp.id_produksi = pr.id
         WHERE dp.id_pesanan = ?`, [id]
      );

      if (detailRows.length === 0) throw new Error('Detail obat kosong.');
      
      // --- INTERAKSI BLOCKCHAIN ---
      gateway = await getGateway(); 
      const network = await gateway.getNetwork('medisyncchannel');
      // Pastikan nama kontrak sesuai dengan yang di-deploy ('ProdusenContract')
      const contract = network.getContract('medisync', 'ProdusenContract');

      const namaPbf = existing[0].nama_pbf;
      const idPbf = existing[0].id_pbf;
      const obatIds = detailRows.map(row => row.batch_id);
      const jumlahPesanan = detailRows.map(row => ({ obatId: row.batch_id, jumlah: row.jumlah_pesanan }));

      console.log(`[Blockchain] Mengirim ${obatIds.length} batch ke PBF ${idPbf}...`);
      
      // Panggil Transaksi transferToPbf (Chaincode v2.0 - PDC Support)
      // Perhatikan: Tidak perlu transient data di sini karena ini adalah event transfer publik
      const transaction = contract.createTransaction('transferToPbf');
      const resultBuffer = await transaction.submit(
        id.toString(), 
        hashSuratJalan || 'TIDAK_ADA_HASH',
        namaPbf,
        idPbf.toString(),
        JSON.stringify(obatIds),
        JSON.stringify(jumlahPesanan)
      );

      const resultJson = JSON.parse(resultBuffer.toString());
      const createdAssetIds = resultJson.createdAssetIds;
      console.log('[Blockchain] Sukses! ID Aset Baru:', createdAssetIds);

      // --- SOCKET.IO ---
      if (req.io) {
        req.io.emit('block_mined', {
          type: 'DISTRIBUSI_PBF',
          hash: '0x' + crypto.randomBytes(32).toString('hex'),
          timestamp: new Date().toLocaleTimeString(),
          org: 'ProdusenMSP',
          details: `Transfer to PBF (PO: ${existing[0].nomor_po})`
        });
      }

      // Update ID Aset Blockchain di MySQL (Pecahan)
      if (createdAssetIds && createdAssetIds.length > 0) {
        for (const assetId of createdAssetIds) {
          // Format ID Baru: BATCH_ID-PESANAN_ID
          // Kita cari ID Batch asli dari string assetId
          const originalBatchId = assetId.substring(0, assetId.lastIndexOf(`-${id}`));
          const correspondingDetail = detailRows.find(d => d.batch_id === originalBatchId);
          
          if (correspondingDetail) {
            await dbConnection.query(
              'UPDATE detail_pesanan SET id_aset_blockchain = ? WHERE id = ?',
              [assetId, correspondingDetail.detail_pesanan_id]
            );
          }
        }
      }
      
      // Finalisasi Status MySQL
      await dbConnection.query('UPDATE surat_jalan_produsen SET status_blockchain = ? WHERE id_pesanan = ?', ['Tercatat', id]);
      await dbConnection.query('UPDATE pesanan SET status = ? WHERE id = ?', [status, id]);
      
      await dbConnection.commit();
      res.json({ success: true, message: `Pesanan berhasil dikirim & tercatat di Blockchain.` });

    } catch (error) {
      console.error('Error updateStatusWithDetails:', error);
      if (dbConnection) await dbConnection.rollback();
      res.status(500).json({ success: false, message: error.message });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },

  // 11. PROSES PENGIRIMAN MASSAL
  prosesPengirimanMassal: async (req, res) => {
    const { pesananDetails, catatanKurirGlobal, tanggalPengiriman, waktuPengiriman, opsiPengiriman } = req.body; 
    const idProdusen = req.user.id;

    if (!pesananDetails || pesananDetails.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data.' });

    let gateway;
    let dbConnection;
    const processedDetails = [];
    const errors = [];

    try {
      dbConnection = await db.getConnection();
      // Buka koneksi gateway sekali untuk semua loop
      gateway = await getGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync', 'ProdusenContract');

      for (const detail of pesananDetails) {
        const pesananId = detail.id;
        const { nomorResi, nomorSuratJalan, catatanPenerima } = detail;

        try {
          await dbConnection.beginTransaction();

          const sqlPesanan = `
            SELECT p.*, pbf.nama_resmi AS nama_pbf, pbf.alamat AS alamat_pbf
            FROM pesanan p JOIN users pbf ON p.id_pbf = pbf.id
            WHERE p.id = ? AND p.id_produsen = ? AND p.status = "Perlu Dikirim" FOR UPDATE
          `;
          const [pesanan] = await dbConnection.query(sqlPesanan, [pesananId, idProdusen]);

          if (pesanan.length === 0) throw new Error(`Pesanan ${pesananId} tidak valid.`);

          const hashSuratJalan = `HASH_SJ_${Date.now()}_${pesananId}`;

          // Insert SJ
          await dbConnection.query(
            `INSERT INTO surat_jalan_produsen (
              id_pesanan, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, 
              waktu_pengiriman, catatan_kurir, catatan_penerima, hash_surat_jalan, opsi_pengiriman
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pesananId, nomorResi, nomorSuratJalan, tanggalPengiriman, pesanan[0].alamat_pbf, 
              waktuPengiriman, catatanKurirGlobal, catatanPenerima, hashSuratJalan, opsiPengiriman
            ]
          );

          // Get Details
          const [detailRows] = await dbConnection.query(
            `SELECT dp.id as detail_pesanan_id, pr.batch_id, dp.jumlah_pesanan
             FROM detail_pesanan dp JOIN produksi pr ON dp.id_produksi = pr.id
             WHERE dp.id_pesanan = ?`, [pesananId]
          );

          if (detailRows.length === 0) throw new Error(`Detail pesanan kosong.`);
          
          const obatIds = detailRows.map(row => row.batch_id);
          const jumlahPesanan = detailRows.map(row => ({ obatId: row.batch_id, jumlah: row.jumlah_pesanan }));
          const idPbf = pesanan[0].id_pbf;

          // Blockchain Transaction
          const transaction = contract.createTransaction('transferToPbf');
          const resultBuffer = await transaction.submit(
            pesananId.toString(), hashSuratJalan, pesanan[0].nama_pbf, idPbf.toString(),
            JSON.stringify(obatIds), JSON.stringify(jumlahPesanan)
          );

          const resultJson = JSON.parse(resultBuffer.toString());
          const createdAssetIds = resultJson.createdAssetIds;

          // Update ID Aset
          if (createdAssetIds && createdAssetIds.length > 0) {
            for (const assetId of createdAssetIds) {
              const originalBatchId = assetId.substring(0, assetId.lastIndexOf(`-${pesananId}`));
              const correspondingDetail = detailRows.find(d => d.batch_id === originalBatchId);
              if (correspondingDetail) {
                await dbConnection.query(
                  'UPDATE detail_pesanan SET id_aset_blockchain = ? WHERE id = ?',
                  [assetId, correspondingDetail.detail_pesanan_id]
                );
              }
            }
          }

          // Emit Socket
          if (req.io) {
            req.io.emit('block_mined', {
              type: 'DISTRIBUSI_PBF_MASSAL',
              hash: '0x' + crypto.randomBytes(32).toString('hex'),
              timestamp: new Date().toLocaleTimeString(),
              org: 'ProdusenMSP',
              details: `Batch Transfer PO: ${pesanan[0].nomor_po}`
            });
          }

          await dbConnection.query('UPDATE surat_jalan_produsen SET status_blockchain = ? WHERE id_pesanan = ?', ['Tercatat', pesananId]);
          await dbConnection.query('UPDATE pesanan SET status = ? WHERE id = ?', ['Dikirim', pesananId]);
          
          await dbConnection.commit();
          processedDetails.push({ id: pesananId, status: 'Sukses' });

        } catch (innerError) {
          await dbConnection.rollback();
          errors.push(`ID ${pesananId}: ${innerError.message}`);
        }
      }

      if (errors.length > 0) {
        return res.status(207).json({ success: false, message: 'Sebagian gagal.', errors, data: processedDetails });
      }

      res.json({ success: true, message: 'Semua pesanan berhasil dikirim.', data: processedDetails });

    } catch (outerError) {
      res.status(500).json({ success: false, message: outerError.message });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },

};

module.exports = pesananMasukController;