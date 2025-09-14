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
          COALESCE(
            (SELECT SUM(dp.total_harga) FROM detail_pesanan dp WHERE dp.id_pesanan = p.id),
            0
          ) AS total_harga,
          p.status,
          p.tanggal_pesanan,
          p.tujuan_distribusi,
          p.catatan_khusus
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
      const { id } = req.params;
      const idProdusen = req.user.id;
      const sql = `
        SELECT sjp.*
        FROM surat_jalan_produsen sjp
        JOIN pesanan p ON sjp.id_pesanan = p.id
        WHERE sjp.id_pesanan = ? AND p.id_produsen = ?
      `;
      const [rows] = await db.query(sql, [id, idProdusen]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data surat jalan tidak ditemukan.' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error in getSuratJalanById:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const idProdusen = req.user.id;
      const validStatuses = ['Perlu Dikirim', 'Dikirim', 'Selesai', 'Ditolak', 'Dikembalikan'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan: ' + validStatuses.join(', ') });
      }

      const [result] = await db.query(
        `UPDATE pesanan SET status = ? WHERE id = ? AND id_produsen = ?`,
        [status, id, idProdusen]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
      }

      res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status}.` });
    } catch (error) {
      console.error('Error in updateStatus:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
  },

  updateStatusWithDetails: async (req, res) => {
    try {
      console.log('Request params:', req.params);
      console.log('Request body:', req.body);
      const { id } = req.params;
      const { status, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman, catatan, hashSuratJalan } = req.body;
      const idProdusen = req.user.id;
      const validStatuses = ['Dikirim', 'Selesai'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid untuk atur pengiriman. Gunakan: ' + validStatuses.join(', ') });
      }

      if (!tanggalPengiriman || !nomorResi || !nomorSuratJalan || !alamatTujuan) {
        return res.status(400).json({ success: false, message: 'Tanggal pengiriman, nomor resi, nomor surat jalan, dan alamat tujuan wajib diisi.' });
      }

      // Simpan ke tabel surat_jalan_produsen
      const sqlSuratJalan = `
        INSERT INTO surat_jalan_produsen (id_pesanan, nomor_resi, nomor_surat_jalan, tanggal_pengiriman, alamat_tujuan, waktu_pengiriman, catatan, hash_surat_jalan, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      await db.query(sqlSuratJalan, [id, nomorResi, nomorSuratJalan, tanggalPengiriman, alamatTujuan, waktuPengiriman, catatan || null, hashSuratJalan || null]);

      // Update status dan catatan_khusus di tabel pesanan
      const [result] = await db.query(
        `UPDATE pesanan SET status = ?, catatan_khusus = ? WHERE id = ? AND id_produsen = ?`,
        [status, catatan || null, id, idProdusen]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
      }

      res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status} dan surat jalan disimpan.` });
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
        `SELECT p.id, p.nomor_po, sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, sjp.alamat_tujuan, sjp.waktu_pengiriman, sjp.catatan, sjp.hash_surat_jalan, pbf.id as id_pbf
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

      // Periksa status pesanan
      const [pesanan] = await dbConnection.query('SELECT status FROM pesanan WHERE id = ? AND id_produsen = ?', [id, idProdusen]);
      if (pesanan.length === 0 || pesanan[0].status !== 'Dikirim') {
        return res.status(400).json({ success: false, message: 'Hanya pesanan dengan status Dikirim yang bisa dicatat ke blockchain.' });
      }

      // Ambil ID obat dari detail_pesanan
      const [detailRows] = await dbConnection.query(
        `SELECT dp.id_produksi, pr.batch_id
         FROM detail_pesanan dp
         JOIN produksi pr ON dp.id_produksi = pr.id
         WHERE dp.id_pesanan = ?`,
        [id]
      );

      if (detailRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Tidak ada obat terkait dengan pesanan ini.' });
      }
      
      const obatIds = detailRows.map(row => row.batch_id).filter(Boolean); // Hanya ambil batch_id yang valid
      if (obatIds.length === 0) {
        return res.status(404).json({ success: false, message: 'Tidak ada ID batch obat yang valid untuk pesanan ini.' });
      }

      gateway = await getGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync');

      // Ambil ID PBF dari tabel 'pesanan'
      const [pbfRows] = await dbConnection.query('SELECT id_pbf FROM pesanan WHERE id = ?', [id]);
      const idPbf = pbfRows[0].id_pbf;
      
      // Ambil data PBF dari tabel 'users'
      const [pbfData] = await dbConnection.query('SELECT nama_resmi FROM users WHERE id = ?', [idPbf]);
      const namaPbf = pbfData[0].nama_resmi;

      const transaction = contract.createTransaction('ProdusenContract:transferToPbf');
      // Set endorsing organizations to ensure proper endorsement from both parties
      transaction.setEndorsingOrganizations('ProdusenMSP', 'PBFMSP');
      
      console.log('Submitting ON-CHAIN transaction for shipment:', shipmentData.nomor_surat_jalan, 'with obatIds:', obatIds);
      
      const args = [
        shipmentData.nomor_surat_jalan, 
        shipmentData.hash_surat_jalan || 'TIDAK ADA HASH',
        namaPbf,
        JSON.stringify(obatIds)
      ];

      // Kirim transaksi ke blockchain
      await transaction.submit(...args);
      console.log('ON-CHAIN transaction for shipment successful!');

      // Perbarui status di database jika berhasil
      await dbConnection.query('UPDATE pesanan SET status = ? WHERE id = ?', ['Selesai', id]);
      await dbConnection.query('UPDATE surat_jalan_produsen SET status_blockchain = ? WHERE id_pesanan = ?', ['Tercatat', id]);

      res.json({
        success: true,
        message: `Pengiriman ${shipmentData.nomor_surat_jalan} berhasil dicatat ke blockchain.`,
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