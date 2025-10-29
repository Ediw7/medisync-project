'use strict';

const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const crypto = require('crypto');


function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}


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
  
  getAll: async (req, res) => {
    try {
      const { month, year, minJumlah, maxJumlah, status, sortBy, sortOrder } = req.query;

     
      let sql = `
        SELECT 
          id, batch_id, nama_obat, jumlah, status, 
          DATE_FORMAT(tanggal_produksi, '%Y-%m-%d') as tanggal_produksi,
          DATE_FORMAT(tanggal_kadaluarsa, '%Y-%m-%d') as tanggal_kadaluarsa,
          qr_code_url 
        FROM produksi 
        WHERE id_produsen = ?`;
      const params = [req.user.id];

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

      const allowedSortBy = ['batch_id', 'nama_obat', 'tanggal_produksi', 'jumlah', 'status'];
      const direction = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      
      if (sortBy && allowedSortBy.includes(sortBy)) {
        sql += ` ORDER BY ${sortBy} ${direction}`;
      } else {
        sql += ' ORDER BY tanggal_produksi DESC';
      }

      const [rows] = await db.query(sql, params);

     
      if (rows.length > 0) {
        console.log('Sample formatted dates in getAll:', {
          produksi: rows[0].tanggal_produksi,
          kadaluarsa: rows[0].tanggal_kadaluarsa
        });
      }

      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  getById: async (req, res) => {
    try {
      
      const [rows] = await db.query(`
        SELECT 
          *, 
          DATE_FORMAT(tanggal_produksi, '%Y-%m-%d') as tanggal_produksi_formatted,
          DATE_FORMAT(tanggal_kadaluarsa, '%Y-%m-%d') as tanggal_kadaluarsa_formatted
        FROM produksi 
        WHERE id = ? AND id_produsen = ?
      `, [req.params.id, req.user.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      }

      
      const data = rows[0];
      data.tanggal_produksi = data.tanggal_produksi_formatted;
      data.tanggal_kadaluarsa = data.tanggal_kadaluarsa_formatted;

     
      console.log('Formatted dates in getById:', {
        produksi: data.tanggal_produksi,
        kadaluarsa: data.tanggal_kadaluarsa
      });

      
      delete data.tanggal_produksi_formatted;
      delete data.tanggal_kadaluarsa_formatted;

      res.json({ success: true, data });
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },
  create: async (req, res) => {

    const {
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


    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStamp = `${year}${month}${day}`; 
    
    const randomHash = crypto.randomBytes(4).toString('hex').toUpperCase(); 
    
  
    const batch_id = `P${id_produsen}-${dateStamp}-${randomHash}`;


   
    if (!nama_obat || !jumlah || !tanggal_produksi || !tanggal_kadaluarsa) { 
      return res.status(400).json({
        success: false,
        message: 'Nama Obat, Jumlah, Tanggal Produksi, dan Tanggal Kadaluarsa wajib diisi.', 
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
    
    if (tanggal_kadaluarsa <= tanggal_produksi) {
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
      res.status(201).json({ 
        success: true, 
        message: 'Jadwal produksi berhasil dibuat', 
        id: result.insertId,
        generated_batch_id: batch_id 
      });
    } catch (error) {
      console.error('Error in create:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Batch ID sudah ada.' });
      }
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  
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
        harga_per_unit || 0,  
        req.params.id,
        req.user.id,
      ];

      console.log('Update SQL placeholders count:', sql.split('?').length - 1); 
      console.log('Update params length:', params.length);

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

recordToBlockchain: async (req, res) => {
  const { id } = req.params;
  const id_produsen = req.user.id;
  let gateway;
  let dbConnection;

  try {
    dbConnection = await db.getConnection();

    const [rows] = await dbConnection.query(`
      SELECT 
        *, 
        DATE_FORMAT(tanggal_produksi, '%Y-%m-%d') as tanggal_produksi_formatted,
        DATE_FORMAT(tanggal_kadaluarsa, '%Y-%m-%d') as tanggal_kadaluarsa_formatted
      FROM produksi 
      WHERE id = ? AND id_produsen = ?
    `, [id, id_produsen]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data produksi tidak ditemukan.' });
    }

    const prodData = rows[0];

    // Map formatted dates ke field original
    prodData.tanggal_produksi = prodData.tanggal_produksi_formatted;
    prodData.tanggal_kadaluarsa = prodData.tanggal_kadaluarsa_formatted;

    // Hapus field temporary
    delete prodData.tanggal_produksi_formatted;
    delete prodData.tanggal_kadaluarsa_formatted;

    if (prodData.status === 'Tercatat di Blockchain') {
      return res.status(400).json({ success: false, message: 'Batch ini sudah pernah dicatat.' });
    }
    if (prodData.status !== 'Selesai') {
      return res.status(400).json({ success: false, message: 'Hanya batch yang sudah Selesai yang bisa dicatat ke blockchain.' });
    }

    
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

   
    const tanggalProduksiFormatted = prodData.tanggal_produksi;
    const tanggalKadaluarsaFormatted = prodData.tanggal_kadaluarsa;

    console.log('Record input dates (formatted):', { 
      produksi: tanggalProduksiFormatted, 
      kadaluarsa: tanggalKadaluarsaFormatted 
    });

    await transaction.submit(
      prodData.batch_id,
      prodData.nama_obat,
      prodData.nomor_izin_edar || 'TIDAK ADA DATA',
      prodData.komposisi_obat || '',
      prodData.dosis || 'N/A',
      tanggalProduksiFormatted,  
      tanggalKadaluarsaFormatted,  
      prodData.bentuk_sediaan,
      prodData.penanggung_jawab,
      prodData.jumlah,
      prodData.harga_per_unit || 0,
      prodData.hash_sertifikat_analisis || 'TIDAK ADA HASH',
      namaPerusahaan
    );
    console.log('ON-CHAIN transaction successful.');


    const qrDataUrl = `http://localhost:5173/blockchain-detail/${prodData.batch_id}`;


    const qrCodeDataUrl = await qrcode.toDataURL(qrDataUrl);

  
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
        
        const [rows] = await dbConnection.query(`
          SELECT 
            *, 
            DATE_FORMAT(tanggal_produksi, '%Y-%m-%d') as tanggal_produksi_formatted,
            DATE_FORMAT(tanggal_kadaluarsa, '%Y-%m-%d') as tanggal_kadaluarsa_formatted
          FROM produksi 
          WHERE batch_id = ?
        `, [batch_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data tidak ditemukan di database' });
        }

        const prodData = rows[0];

        prodData.tanggal_produksi = prodData.tanggal_produksi_formatted;
        prodData.tanggal_kadaluarsa = prodData.tanggal_kadaluarsa_formatted;
        delete prodData.tanggal_produksi_formatted;
        delete prodData.tanggal_kadaluarsa_formatted;

        gateway = await getGateway();
        const network = await gateway.getNetwork('medisyncchannel');
        const contract = network.getContract('medisync');

        const result = await contract.evaluateTransaction('ProdusenContract:readObat', batch_id);
        const blockchainData = JSON.parse(result.toString());

        console.log('=== DEBUG for', batch_id, '===');
        console.log('Raw blockchainData:', JSON.stringify(blockchainData, null, 2));

        const tanggalProduksiFormatted = blockchainData.tanggalProduksi;
        const tanggalKadaluarsaFormatted = blockchainData.tanggalKadaluarsa;

        console.log('Get detail dates from chain:', { 
          produksi: tanggalProduksiFormatted, 
          kadaluarsa: tanggalKadaluarsaFormatted 
        });

    
        const responseData = {
            batch_id: blockchainData.id,
            nama_obat: blockchainData.namaObat,
            tanggal_produksi: tanggalProduksiFormatted,  
            tanggal_kadaluarsa: tanggalKadaluarsaFormatted,  
            penanggung_jawab: blockchainData.penanggungJawab,
            jumlah: blockchainData.jumlah,
            hash_sertifikat: blockchainData.hashDokumen.hasilUjiMutu,
            nama_perusahaan: blockchainData.namaPerusahaan || 'Nama Perusahaan Tidak Tersedia',
            status_saat_ini: blockchainData.statusSaatIni,
            riwayat: blockchainData.riwayat
        };

        console.log('Final responseData nama_perusahaan:', responseData.nama_perusahaan);

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