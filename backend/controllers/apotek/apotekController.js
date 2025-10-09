'use strict';
const db = require('../../config/db');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
const path = require('path');
const fs = require('fs').promises;
const { Gateway, Wallets } = require('fabric-network');

async function getApotekGateway() {
  try {
    const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get('apotekAdmin');
    if (!identity) {
      throw new Error('Identitas "apotekAdmin" tidak ditemukan di wallet.');
    }
    const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org3.json');
    const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'apotekAdmin',
      discovery: { enabled: true, asLocalhost: true }
    });
    return gateway;
  } catch (error) {
    console.error('Error initializing Apotek gateway:', error);
    throw new Error(`Gagal koneksi ke blockchain: ${error.message}`);
  }
}

const apotekController = {
  getPbfList: async (req, res) => {
    try {
      const [rows] = await db.query("SELECT id, nama_resmi, alamat, email FROM users WHERE role = 'pbf'");
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getPbfList:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  getAvailableStockByPbf: async (req, res) => {
    const { idPbf } = req.params;
    const idApotek = req.user.id;
    try {
        const dbName = process.env.COUCHDB_DB || 'medisyncchannel_medisync';
        const dbInstance = nano.use(dbName);
        const query = {
            selector: { docType: 'obat', pemilikSaatIni: 'PBFMSP', jumlah: { "$gt": 0 } },
            fields: ['id', 'namaObat', 'bentukSediaan', 'dosis', 'jumlah', 'hargaPerUnit']
        };
        const result = await dbInstance.find(query);
        const onChainStock = result.docs.map(doc => ({
            id: doc.id,
            nama_obat: doc.namaObat,
            bentuk_sediaan: doc.bentukSediaan,
            dosis: doc.dosis,
            jumlah: doc.jumlah,
            harga_per_unit: doc.hargaPerUnit || 0
        }));
        const sqlRiwayatHarga = `
            WITH LastPurchase AS (
                SELECT dpa.nama_obat, MAX(pa.id) AS last_pesanan_id
                FROM pesanan_apotek pa
                JOIN detail_pesanan_apotek dpa ON pa.id = dpa.id_pesanan_apotek
                WHERE pa.id_apotek = ? AND pa.id_pbf = ?
                GROUP BY dpa.nama_obat
            )
            SELECT dpa.nama_obat, dpa.harga_satuan
            FROM detail_pesanan_apotek dpa
            JOIN LastPurchase lp ON dpa.id_pesanan_apotek = lp.last_pesanan_id AND dpa.nama_obat = lp.nama_obat;
        `;
        const [historicalPrices] = await db.query(sqlRiwayatHarga, [idApotek, idPbf]);
        const priceMap = historicalPrices.reduce((acc, item) => {
            acc[item.nama_obat] = parseFloat(item.harga_satuan);
            return acc;
        }, {});
        const enrichedStock = onChainStock.map(stockItem => {
            const historicalPrice = priceMap[stockItem.nama_obat];
            return {
                ...stockItem,
                harga_per_unit: historicalPrice !== undefined ? historicalPrice : stockItem.harga_per_unit
            };
        });
        res.json({ success: true, data: enrichedStock, source: 'on-chain-with-history' });
    } catch (error) {
        console.error(`Error fetching stock for PBF ${idPbf}:`, error.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil stok dari blockchain.' });
    }
  },

  getAllPesanan: async (req, res) => {
    const idApotek = req.user.id;
    try {
      const sql = `
          SELECT 
              pa.id, pa.nomor_pesanan, pa.total_harga, pa.status, pa.tanggal_pesanan,
              pbf.nama_resmi AS nama_pbf,
              (SELECT dp.id_aset_blockchain FROM detail_pesanan_apotek dp WHERE dp.id_pesanan_apotek = pa.id AND dp.id_aset_blockchain IS NOT NULL LIMIT 1) as id_aset_blockchain
          FROM pesanan_apotek pa
          JOIN users pbf ON pa.id_pbf = pbf.id
          WHERE pa.id_apotek = ?
          ORDER BY pa.tanggal_pesanan DESC
      `;
      const [rows] = await db.query(sql, [idApotek]);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getAllPesanan Apotek:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  getPesananById: async (req, res) => {
    const { id } = req.params;
    const idApotek = req.user.id;
    try {
        const sqlPesanan = `
            SELECT pa.*, pbf.nama_resmi AS nama_pbf, pbf.alamat AS alamat_pbf
            FROM pesanan_apotek pa
            JOIN users pbf ON pa.id_pbf = pbf.id
            WHERE pa.id = ? AND pa.id_apotek = ?
        `;
        const [pesananRows] = await db.query(sqlPesanan, [id, idApotek]);
        if (pesananRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
        }
        const sqlDetail = 'SELECT * FROM detail_pesanan_apotek WHERE id_pesanan_apotek = ?';
        const [detailRows] = await db.query(sqlDetail, [id]);
        res.json({
            success: true,
            data: { pesanan: pesananRows[0], detail_pesanan: detailRows },
        });
    } catch (error) {
        console.error(`Error getting pesanan by ID for Apotek:`, error);
        res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },
  
  createPesanan: async (req, res) => {
    const idApotek = req.user.id;
    const { id_pbf, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon, items, total_harga, tanda_tangan_data_url } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Detail item pesanan tidak boleh kosong.' });
    for (const item of items) {
        if (!item.id_aset_blockchain) return res.status(400).json({ success: false, message: `Item pesanan "${item.nama_obat}" tidak memiliki ID Aset Blockchain.` });
    }
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const base64Data = tanda_tangan_data_url.replace(/^data:image\/png;base64,/, "");
        const fileName = `ttd-apotek-${Date.now()}.png`;
        const filePath = path.join('uploads', 'tanda_tangan', fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, base64Data, 'base64');
        const prefix = `APTK/${new Date().getFullYear()}/`;
        const [lastOrder] = await connection.query("SELECT nomor_pesanan FROM pesanan_apotek WHERE nomor_pesanan LIKE ? ORDER BY id DESC LIMIT 1", [`${prefix}%`]);
        let nextSeq = 1;
        if (lastOrder.length > 0) nextSeq = parseInt(lastOrder[0].nomor_pesanan.split('/').pop(), 10) + 1;
        const nomor_pesanan = `${prefix}${String(nextSeq).padStart(6, '0')}`;
        const [result] = await connection.query(
            `INSERT INTO pesanan_apotek (id_apotek, id_pbf, nomor_pesanan, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon, total_harga, tanda_tangan_apoteker, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [idApotek, id_pbf, nomor_pesanan, nama_apotek, alamat_apotek, jabatan, nomor_sipa, telepon, total_harga, filePath, 'Menunggu Konfirmasi']
        );
        const idPesanan = result.insertId;
        for (const item of items) {
            await connection.query(
                `INSERT INTO detail_pesanan_apotek (id_pesanan_apotek, id_aset_blockchain, nama_obat, keterangan, jumlah, satuan, harga_satuan)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idPesanan, item.id_aset_blockchain, item.nama_obat, item.keterangan, item.qty, item.satuan, item.harga_satuan]
            );
        }
        await connection.commit();
        res.status(201).json({ success: true, message: 'Pesanan ke PBF berhasil dibuat.' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error creating pesanan apotek:', error);
        res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    } finally {
        if (connection) connection.release();
    }
  },

  getProfile: async (req, res) => {
    try {
      const [rows] = await db.query( "SELECT id, nama_resmi, alamat, email, nomor_izin FROM users WHERE id = ? AND role = 'apotek'", [req.user.id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Profil Apotek tidak ditemukan.' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error in getProfile Apotek:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  getRiwayatByAssetId: async (req, res) => {
    const { assetId } = req.params;
    const idApotek = req.user.id;
    let gateway;
    try {
        gateway = await getApotekGateway();
        const network = await gateway.getNetwork('medisyncchannel');
        const contract = network.getContract('medisync');
        const resultBuffer = await contract.evaluateTransaction('ProdusenContract:readObat', assetId);
        const onChainData = JSON.parse(resultBuffer.toString());
        if (onChainData.pemilikSaatIni !== `ApotekMSP`) {
             return res.status(403).json({ success: false, message: 'Anda tidak berwenang melihat riwayat aset ini.' });
        }
        const idPesanan = assetId.substring(assetId.lastIndexOf('-') + 1);
        const sql = `
            SELECT 
                pa.id, pa.nomor_pesanan, pa.status, pa.tanggal_pesanan, pa.bukti_foto,
                sjp.nomor_resi, sjp.nomor_surat_jalan, sjp.tanggal_pengiriman, sjp.opsi_pengiriman,
                pbf.nama_resmi AS nama_pbf,
                apotek.nama_resmi AS nama_apotek
            FROM pesanan_apotek pa
            LEFT JOIN surat_jalan_pbf sjp ON pa.id = sjp.id_pesanan_apotek
            LEFT JOIN users pbf ON pa.id_pbf = pbf.id 
            LEFT JOIN users apotek ON pa.id_apotek = apotek.id
            WHERE pa.id = ? AND pa.id_apotek = ?
        `;
        const [offChainRows] = await db.query(sql, [idPesanan, idApotek]);
        if (offChainRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data pesanan off-chain tidak ditemukan.' });
        }
        return res.json({
            success: true,
            data: { onChain: onChainData, offChain: offChainRows[0] }
        });
    } catch (error) {
        console.error(`Error fetching riwayat Apotek for asset ${assetId}:`, error);
        return res.status(500).json({ success: false, message: `Gagal mengambil data riwayat: ${error.message}` });
    } finally {
        if (gateway) gateway.disconnect();
    }
  },
};

module.exports = apotekController;
