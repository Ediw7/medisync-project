'use strict';

const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const crypto = require('crypto');

// Fungsi untuk menghitung hash SHA-256 dari sebuah file
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

const produksiController = {
  // Mengambil semua jadwal produksi milik produsen yang sedang login
  getAll: async (req, res) => {
    try {
      // Ambil parameter filter & sorting dari req.query
      const { month, year, minJumlah, maxJumlah, status, sortBy, sortOrder } = req.query;

      // Persiapkan query dasar
      let sql = `
        SELECT id, batch_id, nama_obat, jumlah, status, tanggal_produksi, tanggal_kadaluarsa, qr_code_url 
        FROM produksi 
        WHERE id_produsen = ?`;
      const params = [req.user.id];

      // Tambahkan filter secara dinamis
      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (month) {
        sql += ' AND MONTH(tanggal_produksi) = ?';
        params.push(month);
      }
      if (year) {
        sql += ' AND YEAR(tanggal_produksi) = ?';
        params.push(year);
      }
      if (minJumlah) {
        sql += ' AND jumlah >= ?';
        params.push(minJumlah);
      }
      if (maxJumlah) {
        sql += ' AND jumlah <= ?';
        params.push(maxJumlah);
      }
      
      // Tambahkan sorting secara dinamis
      const allowedSortBy = ['batch_id', 'nama_obat', 'tanggal_produksi', 'jumlah', 'status'];
      const direction = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC'; // Default DESC
      
      if (sortBy && allowedSortBy.includes(sortBy)) {
        sql += ` ORDER BY ${sortBy} ${direction}`;
      } else {
        // Default sort
        sql += ' ORDER BY tanggal_produksi DESC';
      }

      const [rows] = await db.query(sql, params);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
},
  // Mengambil satu data produksi berdasarkan ID
  getById: async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM produksi WHERE id = ? AND id_produsen = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    res.json({ success: true, data: rows[0] }); // Pastikan ini mengembalikan semua kolom, termasuk qr_code_url
  } catch (error) {
    console.error('Error in getById:', error);
    res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
  }
},
  // Membuat jadwal produksi baru
  create: async (req, res) => {
    const {
      batch_id,
      nama_obat,
      nomor_izin_edar,
      dosis,
      bentuk_sediaan,
      jumlah,
      tanggal_produksi,
      tanggal_kadaluarsa,
      prioritas,
      status,
      komposisi_obat,
      penanggung_jawab,
      harga_per_unit,
    } = req.body;
    const id_produsen = req.user.id;

    // Validasi field wajib
    if (!batch_id || !nama_obat || !jumlah || !tanggal_produksi || !tanggal_kadaluarsa) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID, Nama Obat, Jumlah, Tanggal Produksi, dan Tanggal Kadaluarsa wajib diisi.',
      });
    }
    if (!bentuk_sediaan) {
      return res.status(400).json({ success: false, message: 'Bentuk sediaan wajib diisi.' });
    }
    if (!penanggung_jawab) {
      return res.status(400).json({ success: false, message: 'Penanggung jawab wajib diisi.' });
    }
    if (Number(jumlah) <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah produksi harus lebih dari 0.' });
    }
    if (new Date(tanggal_kadaluarsa) <= new Date(tanggal_produksi)) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal kadaluarsa harus setelah tanggal produksi.',
      });
    }

    let dokumen_bpom_path = null;
    let sertifikat_analisis_path = null;
    let hash_sertifikat_analisis = null;

    try {
      if (req.files && req.files.dokumen_bpom) {
        dokumen_bpom_path = req.files.dokumen_bpom[0].path;
      }
      if (req.files && req.files.sertifikat_analisis) {
        sertifikat_analisis_path = req.files.sertifikat_analisis[0].path;
        hash_sertifikat_analisis = await calculateFileHash(sertifikat_analisis_path);
      }

      const sql = `INSERT INTO produksi (
        batch_id, nama_obat, nomor_izin_edar, dosis, bentuk_sediaan, jumlah,
        tanggal_produksi, tanggal_kadaluarsa, prioritas, status, komposisi_obat,
        dokumen_bpom_path, sertifikat_analisis_path, hash_sertifikat_analisis, penanggung_jawab, harga_per_unit, id_produsen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        batch_id,
        nama_obat,
        nomor_izin_edar || null,
        dosis || null,
        bentuk_sediaan,
        jumlah,
        tanggal_produksi,
        tanggal_kadaluarsa,
        prioritas || 'Medium',
        status || 'Terjadwal',
        komposisi_obat || null,
        dokumen_bpom_path,
        sertifikat_analisis_path,
        hash_sertifikat_analisis,
        penanggung_jawab,
        harga_per_unit || 0,
        id_produsen,
      ];

      const [result] = await db.query(sql, params);
      res.status(201).json({ success: true, message: 'Jadwal produksi berhasil dibuat', id: result.insertId });
    } catch (error) {
      console.error('Error in create:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Batch ID sudah ada.' });
      }
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // Mengupdate data produksi (DIPERBAIKI: Tambah koma setelah penanggung_jawab, tambah harga_per_unit di SQL)
  update: async (req, res) => {
    const {
      batch_id,
      nama_obat,
      nomor_izin_edar,
      dosis,
      bentuk_sediaan,
      jumlah,
      tanggal_produksi,
      tanggal_kadaluarsa,
      prioritas,
      status,
      komposisi_obat,
      penanggung_jawab,
      harga_per_unit,
    } = req.body;

    // Validasi field wajib
    if (!batch_id || !nama_obat || !jumlah || !tanggal_produksi || !tanggal_kadaluarsa) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID, Nama Obat, Jumlah, Tanggal Produksi, dan Tanggal Kadaluarsa wajib diisi.',
      });
    }
    if (!bentuk_sediaan) {
      return res.status(400).json({ success: false, message: 'Bentuk sediaan wajib diisi.' });
    }
    if (!penanggung_jawab) {
      return res.status(400).json({ success: false, message: 'Penanggung jawab wajib diisi.' });
    }
    if (Number(jumlah) <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah produksi harus lebih dari 0.' });
    }
    if (new Date(tanggal_kadaluarsa) <= new Date(tanggal_produksi)) {
      return res.status(400).json({
        success: false,
        message: 'Tanggal kadaluarsa harus setelah tanggal produksi.',
      });
    }

    let dokumen_bpom_path = req.body.dokumen_bpom_path_existing || null;
    let sertifikat_analisis_path = req.body.sertifikat_analisis_path_existing || null;
    let hash_sertifikat_analisis = req.body.hash_sertifikat_analisis_existing || null;

    try {
      if (req.files && req.files.dokumen_bpom) {
        dokumen_bpom_path = req.files.dokumen_bpom[0].path;
      }
      if (req.files && req.files.sertifikat_analisis) {
        sertifikat_analisis_path = req.files.sertifikat_analisis[0].path;
        hash_sertifikat_analisis = await calculateFileHash(sertifikat_analisis_path);
      }

      // DIPERBAIKI: Tambah koma setelah penanggung_jawab = ?, dan tambah harga_per_unit = ? (total 16 ? di SET + 2 di WHERE = 18 params)
      const sql = `UPDATE produksi SET 
        batch_id = ?, nama_obat = ?, nomor_izin_edar = ?, dosis = ?, bentuk_sediaan = ?, jumlah = ?,
        tanggal_produksi = ?, tanggal_kadaluarsa = ?, prioritas = ?, status = ?, komposisi_obat = ?,
        dokumen_bpom_path = ?, sertifikat_analisis_path = ?, hash_sertifikat_analisis = ?, 
        penanggung_jawab = ?, harga_per_unit = ?
        WHERE id = ? AND id_produsen = ?`;

      const params = [
        batch_id,
        nama_obat,
        nomor_izin_edar || null,
        dosis || null,
        bentuk_sediaan,
        jumlah,
        tanggal_produksi,
        tanggal_kadaluarsa,
        prioritas || 'Medium',
        status || 'Terjadwal',
        komposisi_obat || null,
        dokumen_bpom_path,
        sertifikat_analisis_path,
        hash_sertifikat_analisis,
        penanggung_jawab,
        harga_per_unit || 0,  // DIPERBAIKI: Pastikan ini di akhir SET
        req.params.id,
        req.user.id,
      ];

      console.log('Update SQL placeholders count:', sql.split('?').length - 1); // Debug: Harus 18
      console.log('Update params length:', params.length); // Debug: Harus 18

      const [result] = await db.query(sql, params);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau Anda tidak berwenang' });
      }
      res.json({ success: true, message: 'Data produksi berhasil diperbarui' });
    } catch (error) {
      console.error('Error in update:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Batch ID sudah ada.' });
      }
      if (error.code === 'ER_PARSE_ERROR') {
        return res.status(500).json({ success: false, message: 'Error sintaks SQL. Periksa data input.' });
      }
      res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
    }
  },

  // Menghapus data produksi
  delete: async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM produksi WHERE id = ? AND id_produsen = ?', [
        req.params.id,
        req.user.id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau Anda tidak berwenang' });
      }
      res.json({ success: true, message: 'Data produksi berhasil dihapus' });
    } catch (error) {
      console.error('Error in delete:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  getQrData: async (req, res) => {
    const { batch_id } = req.params;
    let dbConnection;

    try {
      dbConnection = await db.getConnection();
      const [rows] = await dbConnection.query('SELECT * FROM produksi WHERE batch_id = ?', [batch_id]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      }

      const prodData = rows[0];
      const [userRows] = await dbConnection.query('SELECT nama_resmi FROM users WHERE id = ?', [prodData.id_produsen]);
      const namaPerusahaan = userRows.length > 0 ? userRows[0].nama_resmi : 'PT Medisync';

      const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Informasi Obat - ${prodData.batch_id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f4f4f4;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            h1 {
              color: #2c3e50;
              text-align: center;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 15px;
            }
            .info-item label {
              font-weight: bold;
              color: #34495e;
              display: block;
            }
            .info-item span {
              color: #7f8c8d;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Detail Obat</h1>
            <div class="info-item"><label>Batch ID:</label> <span>${prodData.batch_id}</span></div>
            <div class="info-item"><label>Nama Obat:</label> <span>${prodData.nama_obat || '-'}</span></div>
            <div class="info-item"><label>Tanggal Produksi:</label> <span>${new Date(prodData.tanggal_produksi).toLocaleDateString('id-ID')}</span></div>
            <div class="info-item"><label>Tanggal Kadaluarsa:</label> <span>${new Date(prodData.tanggal_kadaluarsa).toLocaleDateString('id-ID')}</span></div>
            <div class="info-item"><label>Penanggung Jawab:</label> <span>${prodData.penanggung_jawab || '-'}</span></div>
            <div class="info-item"><label>Nama Perusahaan:</label> <span>${namaPerusahaan}</span></div>
          </div>
        </body>
        </html>
      `;

      res.set('Content-Type', 'text/html');
      res.send(htmlResponse);
    } catch (error) {
      console.error('Error in getQrData:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  // Fungsi untuk mencatat ke blockchain
 recordToBlockchain: async (req, res) => {
  const { id } = req.params;
  const id_produsen = req.user.id;
  let gateway;
  let dbConnection;

  try {
    dbConnection = await db.getConnection();
    const [rows] = await dbConnection.query('SELECT * FROM produksi WHERE id = ? AND id_produsen = ?', [
      id,
      id_produsen,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data produksi tidak ditemukan.' });
    }

    const prodData = rows[0];

    if (prodData.status === 'Tercatat di Blockchain') {
      return res.status(400).json({ success: false, message: 'Batch ini sudah pernah dicatat.' });
    }
    if (prodData.status !== 'Selesai') {
      return res.status(400).json({ success: false, message: 'Hanya batch yang sudah Selesai yang bisa dicatat ke blockchain.' });
    }

    // Ambil nama_resmi dari DB off-chain (tabel users, kolom nama_resmi)
    const [userRows] = await dbConnection.query('SELECT nama_resmi FROM users WHERE id = ?', [id_produsen]);
    if (userRows.length === 0 || !userRows[0].nama_resmi || userRows[0].nama_resmi.trim() === '') {
      return res.status(400).json({ success: false, message: 'Error: Nama resmi perusahaan tidak ditemukan di database users.' });
    }
    const namaPerusahaan = userRows[0].nama_resmi;

    gateway = await getGateway();
    const network = await gateway.getNetwork('medisyncchannel');
    const contract = network.getContract('medisync');

    const transaction = contract.createTransaction('ProdusenContract:createObat');
    transaction.setEndorsingOrganizations('ProdusenMSP', 'PBFMSP');

    await transaction.submit(
      prodData.batch_id,
      prodData.nama_obat,
      prodData.nomor_izin_edar || 'TIDAK ADA DATA',
      prodData.komposisi_obat || '',
      prodData.dosis || 'N/A',
      new Date(prodData.tanggal_produksi).toISOString().split('T')[0],
      new Date(prodData.tanggal_kadaluarsa).toISOString().split('T')[0],
      prodData.bentuk_sediaan,
      prodData.penanggung_jawab,
      prodData.jumlah,
      prodData.harga_per_unit || 0,
      prodData.hash_sertifikat_analisis || 'TIDAK ADA HASH',
      namaPerusahaan  // Dari DB, wajib
    );
    console.log('ON-CHAIN transaction successful.');

    // Set URL QR ke frontend
    const qrDataUrl = `http://localhost:5173/blockchain-detail/${prodData.batch_id}`;

    // Generate QR dengan URL frontend (ganti hardcode backend menjadi qrDataUrl)
    const qrCodeDataUrl = await qrcode.toDataURL(qrDataUrl);

    // Update DB dengan QR baru
    await dbConnection.query(
      'UPDATE produksi SET status = ?, qr_code_url = ? WHERE id = ?',
      ['Tercatat di Blockchain', qrCodeDataUrl, id]
    );
    console.log('OFF-CHAIN status and QR code updated.');

    res.json({
      success: true,
      message: `Batch ${prodData.batch_id} berhasil dicatat ke blockchain.`,
      qrCodeDataUrl: qrCodeDataUrl,
    });
  } catch (error) {
    console.error('Error recording to blockchain:', error);
    res.status(500).json({ success: false, message: `Gagal mencatat ke blockchain: ${error.message}` });
  } finally {
    if (gateway) gateway.disconnect();
    if (dbConnection) dbConnection.release();
  }
},
getBlockchainDetail: async (req, res) => {
    const { batch_id } = req.params;
    let gateway;
    let dbConnection;

    try {
        dbConnection = await db.getConnection();
        const [rows] = await dbConnection.query('SELECT * FROM produksi WHERE batch_id = ?', [batch_id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan di database' });
        }

        const prodData = rows[0];

        // Koneksi ke blockchain
        gateway = await getGateway();
        const network = await gateway.getNetwork('medisyncchannel');
        const contract = network.getContract('medisync');

        // Panggil fungsi readObat
        const result = await contract.evaluateTransaction('ProdusenContract:readObat', batch_id);
        const blockchainData = JSON.parse(result.toString());

        console.log('=== DEBUG for', batch_id, '===');
        console.log('Raw blockchainData:', JSON.stringify(blockchainData, null, 2));  // Log full raw untuk cek namaPerusahaan

        // Gabungkan data dari blockchain
        const responseData = {
            batch_id: blockchainData.id,
            nama_obat: blockchainData.namaObat,
            tanggal_produksi: blockchainData.tanggalProduksi,
            tanggal_kadaluarsa: blockchainData.tanggalKadaluarsa,
            penanggung_jawab: blockchainData.penanggungJawab,
            jumlah: blockchainData.jumlah,
            hash_sertifikat: blockchainData.hashDokumen.hasilUjiMutu,
            nama_perusahaan: blockchainData.namaPerusahaan || 'Nama Perusahaan Tidak Tersedia',  // Ambil dari ledger
            status_saat_ini: blockchainData.statusSaatIni,
            riwayat: blockchainData.riwayat
        };

        console.log('Final responseData nama_perusahaan:', responseData.nama_perusahaan);  // Log spesifik

        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error('Error in getBlockchainDetail:', error);
        res.status(500).json({ success: false, message: `Gagal mengambil data blockchain: ${error.message}` });
    } finally {
        if (gateway) gateway.disconnect();
        if (dbConnection) dbConnection.release();
    }
},
};

module.exports = produksiController;