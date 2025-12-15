/* File: controllers/produsen/produksiController.js */
'use strict';

const db = require('../../config/db');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const crypto = require('crypto');

// --- HELPER FUNCTIONS ---

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
  if (!fs.existsSync(ccpPath)) {
      throw new Error(`Connection profile tidak ditemukan di: ${ccpPath}`);
  }
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  
  const gateway = new Gateway();
  
  // --- KONFIGURASI IDENTITY ---
  // Sesuai request Anda: menggunakan 'produsen_user_2'
  const identityLabel = 'produsen_user_2'; 
  
  // Cek apakah identity ada di wallet
  const identity = await wallet.get(identityLabel);
  if (!identity) {
      throw new Error(`Identitas "${identityLabel}" tidak ditemukan di wallet. Pastikan Anda sudah login/register dengan user ini.`);
  }

  const connectionOptions = {
    wallet,
    identity: identityLabel,
    discovery: { enabled: true, asLocalhost: true },
  };
  
  await gateway.connect(ccp, connectionOptions);
  return gateway;
}

// --- CONTROLLER UTAMA ---

const produksiController = {
  
  // 1. GET ALL (MySQL)
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

      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (month) { sql += ' AND MONTH(tanggal_produksi) = ?'; params.push(month); }
      if (year) { sql += ' AND YEAR(tanggal_produksi) = ?'; params.push(year); }
      if (minJumlah) { sql += ' AND jumlah >= ?'; params.push(minJumlah); }
      if (maxJumlah) { sql += ' AND jumlah <= ?'; params.push(maxJumlah); }

      const allowedSortBy = ['batch_id', 'nama_obat', 'tanggal_produksi', 'jumlah', 'status'];
      const direction = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      
      if (sortBy && allowedSortBy.includes(sortBy)) {
        sql += ` ORDER BY ${sortBy} ${direction}`;
      } else {
        sql += ' ORDER BY tanggal_produksi DESC';
      }

      const [rows] = await db.query(sql, params);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // 2. GET BY ID (MySQL)
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
      delete data.tanggal_produksi_formatted;
      delete data.tanggal_kadaluarsa_formatted;

      res.json({ success: true, data });
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // 3. CREATE / INPUT JADWAL (MySQL Only)
  create: async (req, res) => {
    const {
      nama_obat, nomor_izin_edar, dosis, bentuk_sediaan, jumlah,
      tanggal_produksi, tanggal_kadaluarsa, prioritas, status,
      komposisi_obat, penanggung_jawab, harga_per_unit,
    } = req.body;
    const id_produsen = req.user.id;

    const now = new Date();
    const dateStamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`; 
    const randomHash = crypto.randomBytes(4).toString('hex').toUpperCase(); 
    const batch_id = `P${id_produsen}-${dateStamp}-${randomHash}`;

    if (!nama_obat || !jumlah || !tanggal_produksi || !tanggal_kadaluarsa) { 
      return res.status(400).json({ success: false, message: 'Field wajib belum diisi.' });
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
        batch_id, nama_obat, nomor_izin_edar || null, dosis || null, bentuk_sediaan,
        jumlah, tanggal_produksi, tanggal_kadaluarsa, prioritas || 'Medium', status || 'Terjadwal',
        komposisi_obat || null, dokumen_bpom_path, sertifikat_analisis_path, hash_sertifikat_analisis,
        penanggung_jawab, harga_per_unit || 0, id_produsen,
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

  // 4. UPDATE (MySQL)
  update: async (req, res) => {
    const {
      batch_id, nama_obat, nomor_izin_edar, dosis, bentuk_sediaan, jumlah,
      tanggal_produksi, tanggal_kadaluarsa, prioritas, status,
      komposisi_obat, penanggung_jawab, harga_per_unit,
    } = req.body;

    if (!batch_id || !nama_obat || !jumlah) {
      return res.status(400).json({ success: false, message: 'Field wajib tidak boleh kosong.' });
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
        batch_id, nama_obat, nomor_izin_edar || null, dosis || null, bentuk_sediaan, jumlah,
        tanggal_produksi, tanggal_kadaluarsa, prioritas || 'Medium', status || 'Terjadwal', komposisi_obat || null,
        dokumen_bpom_path, sertifikat_analisis_path, hash_sertifikat_analisis, penanggung_jawab, harga_per_unit || 0,  
        req.params.id, req.user.id,
      ];

      const [result] = await db.query(sql, params);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan atau Anda tidak berwenang' });
      }
      res.json({ success: true, message: 'Data produksi berhasil diperbarui' });
    } catch (error) {
      console.error('Error in update:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // 5. DELETE (MySQL)
  delete: async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM produksi WHERE id = ? AND id_produsen = ?', [req.params.id, req.user.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
      }
      res.json({ success: true, message: 'Data produksi berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // 6. GET QR DATA (HTML Response)
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
          <title>Informasi Obat - ${prodData.batch_id}</title>
          <style>body{font-family:Arial;padding:20px;max-width:600px;margin:auto;background:#f9f9f9;border:1px solid #ddd;} .label{font-weight:bold;color:#555;} .value{color:#000;}</style>
        </head>
        <body>
          <h2>Detail Obat</h2>
          <p><span class="label">Batch ID:</span> <span class="value">${prodData.batch_id}</span></p>
          <p><span class="label">Nama Obat:</span> <span class="value">${prodData.nama_obat}</span></p>
          <p><span class="label">Produsen:</span> <span class="value">${namaPerusahaan}</span></p>
          <p><span class="label">Status:</span> <span class="value">${prodData.status}</span></p>
        </body>
        </html>
      `;
      res.set('Content-Type', 'text/html');
      res.send(htmlResponse);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error server' });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },

  // 7. RECORD TO BLOCKCHAIN (Dengan Private Data Collection - PDC)
  recordToBlockchain: async (req, res) => {
    const { id } = req.params;
    const id_produsen = req.user.id;
    let gateway;
    let dbConnection;
  
    try {
      dbConnection = await db.getConnection();
  
      // Ambil data dari MySQL
      const [rows] = await dbConnection.query(`
        SELECT *, 
          DATE_FORMAT(tanggal_produksi, '%Y-%m-%d') as tanggal_produksi_formatted,
          DATE_FORMAT(tanggal_kadaluarsa, '%Y-%m-%d') as tanggal_kadaluarsa_formatted
        FROM produksi 
        WHERE id = ? AND id_produsen = ?`, [id, id_produsen]);
  
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data produksi tidak ditemukan.' });
  
      const prodData = rows[0];
      
      if (prodData.status === 'Tercatat di Blockchain') {
        return res.status(400).json({ success: false, message: 'Batch ini sudah tercatat.' });
      }
      if (prodData.status !== 'Selesai') {
        return res.status(400).json({ success: false, message: 'Hanya batch yang statusnya Selesai yang bisa dicatat.' });
      }
      
      const [userRows] = await dbConnection.query('SELECT nama_resmi FROM users WHERE id = ?', [id_produsen]);
      const namaPerusahaan = (userRows.length > 0) ? userRows[0].nama_resmi : 'Perusahaan Tidak Diketahui';
  
      // Connect Blockchain
      gateway = await getGateway();
      const network = await gateway.getNetwork('medisyncchannel');
      const contract = network.getContract('medisync', 'ProdusenContract');
  
      // --- PENERAPAN PDC (TRANSIENT DATA) ---
      console.log(`[PDC] Mencatat batch ${prodData.batch_id} ke blockchain dengan identitas produsen_user_2...`);
      
      const transaction = contract.createTransaction('createObat');
      
      // Siapkan Data Rahasia (Harga, Komposisi, Dosis, Hash)
      // Harus dikonversi ke Buffer
      const transientData = {
          hargaPerUnit: Buffer.from(String(prodData.harga_per_unit || 0)),
          komposisi: Buffer.from(String(prodData.komposisi_obat || '-')),
          dosis: Buffer.from(String(prodData.dosis || '-')),
          hashHasilUjiMutu: Buffer.from(String(prodData.hash_sertifikat_analisis || ''))
      };
      
      // Set Transient
      transaction.setTransient(transientData);
  
      // Submit Transaksi (HANYA DATA PUBLIK)
      await transaction.submit(
        prodData.batch_id,
        prodData.nama_obat,
        prodData.nomor_izin_edar || 'N/A',
        prodData.tanggal_produksi_formatted,  
        prodData.tanggal_kadaluarsa_formatted,  
        prodData.bentuk_sediaan,
        prodData.penanggung_jawab,
        String(prodData.jumlah),
        namaPerusahaan,
        String(id_produsen)
      );
      
      console.log(`[PDC] Sukses mencatat batch ${prodData.batch_id}`);
  
      // Update MySQL Status & QR
      const qrDataUrl = `http://localhost:5173/blockchain-detail/${prodData.batch_id}`;
      const qrCodeDataUrl = await qrcode.toDataURL(qrDataUrl);
  
      await dbConnection.query(
        'UPDATE produksi SET status = ?, qr_code_url = ? WHERE id = ?',
        ['Tercatat di Blockchain', qrCodeDataUrl, id]
      );

      // Emit Socket IO (Notifikasi)
      if (req.io) {
        req.io.emit('block_mined', {
          type: 'PRODUKSI_BARU',
          hash: '0x' + crypto.randomBytes(32).toString('hex'), 
          timestamp: new Date().toLocaleTimeString(),
          org: 'ProdusenMSP',
          details: `Batch ${prodData.batch_id} created with Privacy`
        });
      }
  
      res.json({
        success: true,
        message: `Batch ${prodData.batch_id} berhasil dicatat (PDC Aktif).`,
        qrCodeDataUrl: qrCodeDataUrl,
      });

    } catch (error) {
      console.error('[Blockchain Error]:', error);
      res.status(500).json({ success: false, message: `Gagal mencatat: ${error.message}` });
    } finally {
      if (gateway) gateway.disconnect();
      if (dbConnection) dbConnection.release();
    }
  },

  // 8. GET BLOCKCHAIN DETAIL (Read with Privacy Access)
  getBlockchainDetail: async (req, res) => {
    const { batch_id } = req.params;
    let gateway;

    try {
        gateway = await getGateway();
        const network = await gateway.getNetwork('medisyncchannel');
        const contract = network.getContract('medisync', 'ProdusenContract');

        // Membaca dari blockchain.
        // Karena kita menggunakan 'produsen_user_2' (Org1), kita SEHARUSNYA bisa melihat data private kita sendiri.
        const result = await contract.evaluateTransaction('readObat', batch_id);
        const blockchainData = JSON.parse(result.toString());

        const responseData = {
            batch_id: blockchainData.id,
            nama_obat: blockchainData.namaObat,
            tanggal_produksi: blockchainData.tanggalProduksi,
            tanggal_kadaluarsa: blockchainData.tanggalKadaluarsa,
            penanggung_jawab: blockchainData.penanggungJawab,
            jumlah: blockchainData.jumlah,
            nama_perusahaan: blockchainData.namaPerusahaan,
            status_saat_ini: blockchainData.statusSaatIni,
            
            // Field ini hanya muncul jika akses PDC valid
            harga_per_unit: blockchainData.hargaPerUnit || '(Restricted/Private)',
            komposisi: blockchainData.komposisi || '(Restricted/Private)',
            dosis: blockchainData.dosis || '(Restricted/Private)',
            hash_sertifikat: blockchainData.hashDokumen ? blockchainData.hashDokumen.hasilUjiMutu : null,
            
            riwayat: blockchainData.riwayat
        };

        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error('Error getBlockchainDetail:', error);
        res.status(500).json({ success: false, message: `Gagal baca blockchain: ${error.message}` });
    } finally {
        if (gateway) gateway.disconnect();
    }
  },
};

module.exports = produksiController;