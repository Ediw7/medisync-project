'use strict';

const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

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
          -- KITA HAPUS 'id_aset_blockchain' DARI SINI KARENA AKAN DIAMBIL DI DETAIL
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        WHERE p.id_produsen = ? AND pbf.role = 'pbf'
        ORDER BY p.tanggal_pesanan DESC
      `;
      const [rows] = await db.query(sql, [idProdusen]);

      const sqlDetail = `
        SELECT 
          dp.id, 
          dp.nama_obat, 
          dp.jumlah_pesanan, 
          pr.batch_id,
          dp.id_aset_blockchain AS asset_id_blockchain -- TAMBAHKAN FIELD INI
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
      console.error('Error in getAll pesanan masuk:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
},

// --- GANTI FUNGSI LAMA DENGAN YANG INI ---
  getMassalDetails: async (req, res) => {
    const { selectedIds } = req.body;
    const idProdusen = req.user.id; // Produsen yang sedang login

    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res.status(400).json({ success: false, message: 'selectedIds harus berupa array yang tidak kosong.' });
    }

    try {
      const placeholders = selectedIds.map(() => '?').join(',');
      
      // PERBAIKAN SQL: Mengambil dari tabel 'pesanan' (Produsen -> PBF)
      const sql = `
        SELECT 
          p.id, 
          p.nomor_po,  -- <-- Mengambil nomor_po
          p.status,
          u.nama_resmi AS nama_pbf, -- <-- Mengambil nama PBF
          u.alamat AS alamat_pbf     -- <-- Mengambil alamat PBF
        FROM pesanan p
        JOIN users u ON p.id_pbf = u.id
        WHERE p.id_produsen = ? AND p.id IN (${placeholders})
      `;
      
      const params = [idProdusen, ...selectedIds];
      
      const [rows] = await db.query(sql, params);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tidak ada data pesanan yang ditemukan untuk ID yang dipilih.' });
      }

      // Kirim data yang benar (nama_pbf, alamat_pbf, nomor_po)
      res.json({ success: true, data: rows });

    } catch (error) {
      console.error('Error in getMassalDetails:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal', error: error.message });
    }
  },
  // --- AKHIR FUNGSI BARU ---
  getPesananById: async (req, res) => {
  try {
    const { id } = req.params;
    const idProdusen = req.user.id;
    const sqlPesanan = `
        SELECT 
          p.*, 
          pbf.nama_resmi AS nama_pbf,
          pbf.alamat AS alamat_pbf,
          produsen.nama_resmi AS nama_produsen,
          produsen.alamat AS alamat_produsen,
          sjp.nomor_surat_jalan
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        JOIN users produsen ON p.id_produsen = produsen.id
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        WHERE p.id = ? AND p.id_produsen = ?
      `;
    const [pesanan] = await db.query(sqlPesanan, [id, idProdusen]);

    if (pesanan.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
    }

    const sqlDetail = `
      SELECT 
        dp.id,
        dp.nama_obat,
        dp.bentuk_sediaan,
        dp.dosis,
        dp.jumlah_pesanan,
        dp.harga_per_unit,
        dp.total_harga,
        pr.batch_id
      FROM detail_pesanan dp
      LEFT JOIN produksi pr ON dp.id_produksi = pr.id
      WHERE dp.id_pesanan = ?
    `;
    const [detail] = await db.query(sqlDetail, [id]);

    // Ekstrak alasan dari catatan_khusus
    let alasan_pembatalan = '-';
    if (pesanan[0].catatan_khusus && pesanan[0].catatan_khusus.includes('Alasan:')) {
      alasan_pembatalan = pesanan[0].catatan_khusus.split('Alasan:')[1].trim() || '-';
    }

    res.json({
      success: true,
      data: {
        pesanan: { ...pesanan[0], alasan_pembatalan },
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
      const { id } = req.params;
      const idProdusen = req.user.id;
      const sqlPesanan = `
        SELECT 
          p.id AS pesanan_id, p.nomor_po, p.tanggal_pesanan, p.status, p.total_harga,
          p.nama_pbf, p.alamat_pbf, p.kontak_telepon, p.kontak_email, p.nama_apoteker, p.nomor_sipa,
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

      const sqlDetail = `
        SELECT dp.*, pr.batch_id
        FROM detail_pesanan dp
        JOIN produksi pr ON dp.id_produksi = pr.id
        WHERE dp.id_pesanan = ?
      `;
      const [detailRows] = await db.query(sqlDetail, [id]);

      const responseData = {
        pesanan: pesananRows[0],
        detail_pesanan: detailRows,
      };

      res.json({ success: true, data: responseData });
    } catch (error) {
      console.error('Error in getSuratJalanById:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  getDetailPengembalian: async (req, res) => {
    const { id } = req.params; // ID Pesanan
    const idProdusen = req.user.id;

    try {
      const sql = `
        SELECT 
          p.id,
          p.nomor_po,
          p.catatan_khusus,
          p.bukti_foto,
          p.status,
          p.tanggal_pesanan,
          p.total_harga,
          pbf.nama_resmi AS nama_pbf,
         
          sjp.nomor_surat_jalan 
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        WHERE p.id = ? AND p.id_produsen = ? 
        AND (p.status = 'Pengembalian Diajukan' OR p.status = 'Dikembalikan')
      `;
      const [pesanan] = await db.query(sql, [id, idProdusen]);

      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Data pengajuan pengembalian tidak ditemukan atau Anda tidak berwenang.' });
      }

      // Ekstrak alasan dari catatan_khusus
      let alasan_pengembalian = '-';
      if (pesanan[0].catatan_khusus && pesanan[0].catatan_khusus.includes('Alasan:')) {
        alasan_pengembalian = pesanan[0].catatan_khusus.split('Alasan:')[1].trim();
      }
      
      const responseData = {
        ...pesanan[0],
        alasan_pengembalian: alasan_pengembalian
      };

      res.json({ success: true, data: responseData });

    } catch (error) {
      console.error('Error in getDetailPengembalian:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // --- FUNGSI BARU 1: Menyetujui Pengembalian ---
  approvePengembalian: async (req, res) => {
    const { id } = req.params; // ID Pesanan
    const idProdusen = req.user.id;
    let dbConnection;

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // Pastikan pesanan ada dan statusnya benar
      const [pesanan] = await dbConnection.query(
        "SELECT id FROM pesanan WHERE id = ? AND id_produsen = ? AND status = 'Pengembalian Diajukan'",
        [id, idProdusen]
      );

      if (pesanan.length === 0) {
        throw new Error('Pesanan tidak ditemukan atau tidak dalam status pengajuan pengembalian.');
      }

      // Update status pesanan menjadi 'Dikembalikan'
      await dbConnection.query(
        "UPDATE pesanan SET status = 'Dikembalikan' WHERE id = ?",
        [id]
      );
      
      // Di dunia nyata, Anda akan membuat surat jalan pulang dan mencatatnya.
      // Di sini kita simulasikan dengan mencatat di catatan khusus.
      const nomorSuratJalanPulang = `SJPULANG-${Date.now()}`;
      await dbConnection.query(
        "UPDATE pesanan SET catatan_khusus = CONCAT(IFNULL(catatan_khusus, ''), ?) WHERE id = ?",
        [`\nPengembalian disetujui. No SJ Pulang: ${nomorSuratJalanPulang}`, id]
      );

      await dbConnection.commit();
      res.json({ success: true, message: 'Pengajuan pengembalian telah disetujui.' });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in approvePengembalian:', error);
      res.status(500).json({ success: false, message: error.message || 'Kesalahan Server Internal' });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  rejectPengembalian: async (req, res) => {
    const { id } = req.params; // ID Pesanan
    const { alasan_penolakan } = req.body; // <-- Ambil alasan dari body
    const idProdusen = req.user.id;
    let dbConnection;

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // 1. Validasi alasan
      if (!alasan_penolakan || alasan_penolakan.trim() === '') {
        throw new Error('Alasan penolakan wajib diisi.');
      }

      // 2. Cek pesanan
      const [pesanan] = await dbConnection.query(
        "SELECT id, catatan_khusus FROM pesanan WHERE id = ? AND id_produsen = ? AND status = 'Pengembalian Diajukan'",
        [id, idProdusen]
      );

      if (pesanan.length === 0) {
        throw new Error('Pesanan tidak ditemukan atau tidak dalam status pengajuan pengembalian.');
      }

      // 3. Update status dan tambahkan alasan ke catatan
      //    Gunakan prefix unik agar bisa dibedakan dari penolakan pembatalan
      const catatanBaru = (pesanan[0].catatan_khusus || '') + `\n[PENOLAKAN PENGEMBALIAN]: ${alasan_penolakan}`;
      
      await dbConnection.query(
        "UPDATE pesanan SET status = 'Pengembalian Ditolak', catatan_khusus = ? WHERE id = ?", // <-- Ubah status
        [catatanBaru, id]
      );
      // --- AKHIR PERBAIKAN ---

      await dbConnection.commit();
      res.json({ success: true, message: 'Pengajuan pengembalian telah ditolak.' });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in rejectPengembalian:', error);
      res.status(500).json({ success: false, message: error.message || 'Kesalahan Server Internal' });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  // --- FUNGSI BARU 2: Mendapatkan Data Lacak Pengembalian ---
  getLacakPengembalian: async (req, res) => {
    const { id } = req.params;
    const idProdusen = req.user.id;

    try {
      const sql = `
        SELECT 
          p.id, p.status, p.tanggal_pesanan,
          p.bukti_foto_pengembalian,
          sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman,
          pbf.nama_resmi AS nama_pbf,
          produsen.nama_resmi AS nama_produsen
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        JOIN users produsen ON p.id_produsen = produsen.id
        LEFT JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
        WHERE p.id = ? AND p.id_produsen = ?
      `;
      const [rows] = await db.query(sql, [id, idProdusen]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data pelacakan tidak ditemukan.' });
      }

      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error in getLacakPengembalian:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },


  

  confirmReturnReceipt: async (req, res) => {
    const { id } = req.params; // ID Pesanan
    const idProdusen = req.user.id;
    const buktiFoto = req.file;
    let dbConnection;

    try {
      if (!buktiFoto) {
        return res.status(400).json({ success: false, message: 'Bukti foto penerimaan wajib diunggah.' });
      }

      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // Ambil juga id_aset_blockchain
      const [pesanan] = await dbConnection.query(
        "SELECT id, (SELECT id_aset_blockchain FROM detail_pesanan WHERE id_pesanan = p.id LIMIT 1) as id_aset_blockchain FROM pesanan p WHERE id = ? AND id_produsen = ? AND status = 'Dikembalikan'",
        [id, idProdusen]
      );

      if (pesanan.length === 0) {
        throw new Error('Pesanan tidak ditemukan atau statusnya bukan "Dikembalikan".');
      }

      await dbConnection.query(
        "UPDATE pesanan SET status = 'Pengembalian Selesai', bukti_foto_pengembalian = ? WHERE id = ?",
        [buktiFoto.path, id]
      );

      await dbConnection.commit();
      
      // Kembalikan id_aset_blockchain dalam respons
      res.json({ 
        success: true, 
        message: 'Penerimaan barang yang dikembalikan berhasil dikonfirmasi.',
        assetId: pesanan[0].id_aset_blockchain
      });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in confirmReturnReceipt:', error);
      res.status(500).json({ success: false, message: error.message || 'Kesalahan Server Internal' });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },



  // Di dalam file: backend/controllers/produsen/pesananMasukController.js

updateStatusWithDetails: async (req, res) => {
    const { id } = req.params; // Ini adalah id_pesanan
    const { status, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman, catatan, hashSuratJalan, opsiPengiriman } = req.body;
    const idProdusen = req.user.id;

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
      const [existing] = await dbConnection.query('SELECT id, id_pbf, nama_pbf FROM pesanan WHERE id = ? AND id_produsen = ?', [id, idProdusen]);
      if (existing.length === 0) {
        throw new Error('Pesanan tidak ditemukan atau Anda tidak memiliki akses.');
      }

      const sqlSuratJalan = `
        INSERT INTO surat_jalan_produsen (id_pesanan, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, waktu_pengiriman, catatan, hash_surat_jalan, opsi_pengiriman)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          nomor_resi = VALUES(nomor_resi), nomor_surat_jalan = VALUES(nomor_surat_jalan), tanggal_pengiriman = VALUES(tanggal_pengiriman),
          alamat_tujuan = VALUES(alamat_tujuan), waktu_pengiriman = VALUES(waktu_pengiriman), catatan = VALUES(catatan),
          hash_surat_jalan = VALUES(hash_surat_jalan), opsi_pengiriman = VALUES(opsi_pengiriman)`;
      
      await dbConnection.query(sqlSuratJalan, [id, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman || null, catatan || null, hashSuratJalan || null, opsiPengiriman?.toLowerCase() || 'standar']);
      
      const [detailRows] = await dbConnection.query(
        `SELECT dp.id as detail_pesanan_id, pr.batch_id, dp.jumlah_pesanan
         FROM detail_pesanan dp JOIN produksi pr ON dp.id_produksi = pr.id
         WHERE dp.id_pesanan = ?`, [id]
      );

      if (detailRows.length === 0) {
        throw new Error('Tidak ada detail obat yang ditemukan untuk pesanan ini.');
      }
      
      // --- Langkah 3: Proses On-Chain (Hyperledger Fabric) ---
      gateway = await getGateway(); // Gunakan getGateway yang ada di file ini
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      const namaPbf = existing[0].nama_pbf;
      const idPbf = existing[0].id_pbf;
      const obatIds = detailRows.map(row => row.batch_id);
      const jumlahPesanan = detailRows.map(row => ({ obatId: row.batch_id, jumlah: row.jumlah_pesanan }));

      console.log('Submitting ON-CHAIN transaction for shipment:', nomorSuratJalan);
      const transaction = contract.createTransaction('ProdusenContract:transferToPbf');
      
      const resultBuffer = await transaction.submit(
        id.toString().padStart(6, '0'), // Pastikan ID pesanan sesuai format
        hashSuratJalan || 'TIDAK_ADA_HASH',
        namaPbf,
        idPbf.toString(),
        JSON.stringify(obatIds),
        JSON.stringify(jumlahPesanan)
      );

      const resultJson = JSON.parse(resultBuffer.toString());
      const createdAssetIds = resultJson.createdAssetIds;
      console.log('ON-CHAIN transaction successful! New asset IDs:', createdAssetIds);

      // --- Langkah 4: Simpan ID Aset Blockchain ke MySQL ---
      if (createdAssetIds && createdAssetIds.length > 0) {
        for (const assetId of createdAssetIds) {
          // Ekstrak batch ID asli dari ID aset baru (asumsi format 'batchId-pesananId')
          const originalBatchId = assetId.substring(0, assetId.lastIndexOf('-')); 
          const correspondingDetail = detailRows.find(d => d.batch_id === originalBatchId);
          if (correspondingDetail) {
            await dbConnection.query(
              'UPDATE detail_pesanan SET id_aset_blockchain = ? WHERE id = ?',
              [assetId, correspondingDetail.detail_pesanan_id]
            );
             console.log(`Updated detail_pesanan ID ${correspondingDetail.detail_pesanan_id} with blockchain asset ID ${assetId}`);
          }
        }
      }
      
      // --- Langkah 5: Finalisasi Update di MySQL ---
      await dbConnection.query('UPDATE surat_jalan_produsen SET status_blockchain = ? WHERE id_pesanan = ?', ['Tercatat', id]);
      await dbConnection.query('UPDATE pesanan SET status = ? WHERE id = ?', [status, id]);
      
      await dbConnection.commit();
      
      res.json({ success: true, message: `Pesanan berhasil dikirim dan dicatat ke blockchain.` });

    } catch (error) {
      console.error('Error in updateStatusWithDetails:', error);
      if (dbConnection) await dbConnection.rollback();
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },

  recordToBlockchainForShipment: async (req, res) => {
    const { id } = req.params;
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
        id.toString(),
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

  
  prosesPengirimanMassal: async (req, res) => {
    const { selectedIds, tanggalPengiriman, waktuPengiriman, catatan, opsiPengiriman } = req.body;
    const idProdusen = req.user.id;

    if (!selectedIds || selectedIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada pesanan yang dipilih.' });
    }

    let gateway;
    let dbConnection;
    const processedDetails = [];
    const errors = [];

    try {
      dbConnection = await db.getConnection();
      gateway = await getGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      for (const pesananId of selectedIds) {
        try {
          await dbConnection.beginTransaction();

          // Ambil data pesanan DAN data PBF/Produsen untuk surat jalan
          const sqlPesanan = `
            SELECT 
              p.*, 
              pbf.nama_resmi AS nama_pbf, pbf.alamat AS alamat_pbf,
              produsen.nama_resmi AS nama_produsen, produsen.alamat AS alamat_produsen
            FROM pesanan p
            JOIN users pbf ON p.id_pbf = pbf.id
            JOIN users produsen ON p.id_produsen = produsen.id
            WHERE p.id = ? AND p.id_produsen = ? AND p.status = "Perlu Dikirim" 
            FOR UPDATE
          `;
          const [pesanan] = await dbConnection.query(sqlPesanan, [pesananId, idProdusen]);

          if (pesanan.length === 0) {
            throw new Error(`Pesanan tidak ditemukan atau statusnya bukan "Perlu Dikirim".`);
          }

          const timestamp = Date.now();
          const nomorResi = `RES-${timestamp}-${pesananId}`;
          const nomorSuratJalan = `SJ-${timestamp}-${pesananId}`;
          const hashSuratJalan = `HASH_SJPROD_${timestamp}_${pesananId}`;

          // Masukkan ke surat_jalan_produsen
          await dbConnection.query(
            `INSERT INTO surat_jalan_produsen (id_pesanan, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, waktu_pengiriman, catatan, hash_surat_jalan, opsi_pengiriman)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [pesananId, nomorResi, nomorSuratJalan, tanggalPengiriman, pesanan[0].alamat_pbf, waktuPengiriman || null, catatan || null, hashSuratJalan, opsiPengiriman]
          );

          // Ambil detail pesanan untuk dikirim ke chaincode
          const [detailRows] = await dbConnection.query(
            `SELECT dp.id as detail_pesanan_id, pr.batch_id, dp.jumlah_pesanan, dp.nama_obat, dp.total_harga
             FROM detail_pesanan dp JOIN produksi pr ON dp.id_produksi = pr.id
             WHERE dp.id_pesanan = ?`, [pesananId]
          );

          if (detailRows.length === 0) throw new Error(`Detail pesanan tidak ditemukan.`);
          
          const obatIds = detailRows.map(row => row.batch_id).filter(Boolean);
          const jumlahPesanan = detailRows.map(row => ({ obatId: row.batch_id, jumlah: row.jumlah_pesanan }));

          if (obatIds.length === 0) {
             throw new Error('Tidak ada ID batch obat yang valid untuk pesanan ini.');
          }

          // Panggil Chaincode
          const transaction = contract.createTransaction('ProdusenContract:transferToPbf');
          const resultBuffer = await transaction.submit(
            pesananId.toString(), hashSuratJalan, pesanan[0].nama_pbf,
            JSON.stringify(obatIds), JSON.stringify(jumlahPesanan)
          );

          const resultJson = JSON.parse(resultBuffer.toString());
          const createdAssetIds = resultJson.createdAssetIds;

          // Update detail_pesanan dengan Aset ID BARU
          if (createdAssetIds && createdAssetIds.length > 0) {
            for (const assetId of createdAssetIds) {
              const originalBatchId = assetId.substring(0, assetId.lastIndexOf(`-${pesananId}`));
              const correspondingDetail = detailRows.find(d => d.batch_id === originalBatchId);
              if (correspondingDetail) {
                await dbConnection.query(
                  'UPDATE detail_pesanan SET id_aset_blockchain = ? WHERE id = ?',
                  [assetId, correspondingDetail.detail_pesanan_id]
                );
                // Perbarui juga assetId di detailRows untuk dikirim ke frontend
                correspondingDetail.id_aset_blockchain = assetId; 
              }
            }
          }

          // Finalisasi update DB
          await dbConnection.query('UPDATE surat_jalan_produsen SET status_blockchain = ? WHERE id_pesanan = ?', ['Tercatat', pesananId]);
          await dbConnection.query('UPDATE pesanan SET status = ? WHERE id = ?', ['Dikirim', pesananId]);
          
          await dbConnection.commit();

          // Siapkan data untuk respons
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
      console.error('Error in prosesPengirimanMassal (Outer - Produsen):', outerError);
      res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${outerError.message}` });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },



};

module.exports = pesananMasukController;