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
          p.tanggal_pesanan,
          (SELECT dp.id_aset_blockchain 
           FROM detail_pesanan dp 
           WHERE dp.id_pesanan = p.id 
           LIMIT 1) AS id_aset_blockchain
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
    const sqlPesanan = `
      SELECT 
        p.id,
        p.nomor_po,
        p.nama_pbf,
        p.alamat_pbf,
        p.nomor_siup,
        p.kontak_telepon,
        p.kontak_email,
        p.nomor_sia_sika,
        p.tanda_tangan_apoteker,
        p.nama_apoteker,
        p.nomor_sipa,
        COALESCE((SELECT SUM(dp.total_harga) FROM detail_pesanan dp WHERE dp.id_pesanan = p.id), 0) AS total_harga,
        p.status,
        p.tanggal_pesanan,
        p.tujuan_distribusi,
        p.catatan_khusus,
        p.updated_at AS tanggal_pengajuan_pembatalan
      FROM pesanan p
      JOIN users pbf ON p.id_pbf = pbf.id
      WHERE p.id = ? AND p.id_produsen = ? AND pbf.role = 'pbf'
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
      const obatIds = detailRows.map(row => row.batch_id);
      const jumlahPesanan = detailRows.map(row => ({ obatId: row.batch_id, jumlah: row.jumlah_pesanan }));

      console.log('Submitting ON-CHAIN transaction for shipment:', nomorSuratJalan);
      const transaction = contract.createTransaction('ProdusenContract:transferToPbf');
      
      const resultBuffer = await transaction.submit(
        id.toString().padStart(6, '0'), // Pastikan ID pesanan sesuai format
        hashSuratJalan || 'TIDAK_ADA_HASH',
        namaPbf,
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
};

module.exports = pesananMasukController;