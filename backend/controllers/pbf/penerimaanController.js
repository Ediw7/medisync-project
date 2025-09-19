'use strict';

const db = require('../../config/db');
const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@127.0.0.1:5984`);
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

const penerimaanController = {
  // Mengonfirmasi penerimaan pesanan dengan unggah foto
  confirmPenerimaan: async (req, res) => {
    try {
      const { id } = req.params;
      const idPbf = req.user.id;
      const buktiFoto = req.file;

      if (!buktiFoto) {
        return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
      }

      const [pesanan] = await db.query(
        'SELECT id, status, nomor_surat_jalan FROM pesanan WHERE id = ? AND id_pbf = ?',
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
      }

      if (pesanan[0].status !== 'Dikirim') {
        return res.status(400).json({
          success: false,
          message: 'Pesanan hanya dapat dikonfirmasi jika statusnya "Dikirim".',
        });
      }

      const fileName = `${uuidv4()}${path.extname(buktiFoto.originalname)}`;
      const filePath = path.join(__dirname, '../../../uploads', fileName);
      await fs.writeFile(filePath, buktiFoto.buffer);

      await db.query('UPDATE pesanan SET status = ?, bukti_foto = ? WHERE id = ?', ['Selesai', fileName, id]);

      const dbCouch = nano.use('medisyncchannel_medisync');
      const [detailPesanan] = await db.query(
        'SELECT id_produksi FROM detail_pesanan WHERE id_pesanan = ?',
        [id]
      );

      for (const item of detailPesanan) {
        try {
          const hashSuratJalan = pesanan[0].nomor_surat_jalan || `SJ-${id}-${Date.now()}`;
          await dbCouch.invoke({
            chaincode: 'pbfcontract',
            fcn: 'transferToApotek',
            args: [item.id_produksi, hashSuratJalan],
          });
        } catch (couchError) {
          console.error(`Error invoking chaincode for id_produksi ${item.id_produksi}:`, couchError);
        }
      }

      res.json({ success: true, message: 'Pesanan berhasil dikonfirmasi dan diarsipkan di blockchain.' });
    } catch (error) {
      console.error('Error in confirmPenerimaan:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // Mengonfirmasi pesanan (mengubah status dari "Dipesan" menjadi "Perlu Dikirim")
  confirmPesanan: async (req, res) => {
    try {
      const { id } = req.params;
      const idPbf = req.user.id;

      const [pesanan] = await db.query(
        'SELECT id, status FROM pesanan WHERE id = ? AND id_pbf = ?',
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
      }

      if (pesanan[0].status !== 'Dipesan') {
        return res.status(400).json({
          success: false,
          message: 'Pesanan hanya dapat dikonfirmasi jika statusnya "Dipesan".',
        });
      }

      await db.query('UPDATE pesanan SET status = ? WHERE id = ?', ['Perlu Dikirim', id]);

      res.json({ success: true, message: 'Pesanan berhasil dikonfirmasi.' });
    } catch (error) {
      console.error('Error in confirmPesanan:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },
};

module.exports = penerimaanController;