'use strict';

const db = require('../../config/db');

const pembatalanController = {
  konfirmasiPembatalan: async (req, res) => {
    console.log(`Received request for /pesanan/${req.params.id}/konfirmasi-pembatalan`);
    const { id } = req.params;
    const { status } = req.body; // 'Dibatalkan' atau 'Perlu Dikirim'
    const idProdusen = req.user.id;

    let dbConnection;
    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      const [currentPesanan] = await dbConnection.query(
        "SELECT status FROM pesanan WHERE id = ? AND id_produsen = ?",
        [id, idProdusen]
      );

      if (currentPesanan.length === 0) {
        throw new Error('Pesanan tidak ditemukan atau Anda tidak berwenang.');
      }

      if (currentPesanan[0].status !== 'Pembatalan Diajukan') {
        throw new Error("Aksi tidak valid. Pesanan tidak dalam status 'Pembatalan Diajukan'.");
      }

      if (status === 'Dibatalkan') {
        const [items] = await dbConnection.query("SELECT id_produksi, jumlah_pesanan FROM detail_pesanan WHERE id_pesanan = ?", [id]);
        for (const item of items) {
          await dbConnection.query("UPDATE produksi SET jumlah = jumlah + ? WHERE id = ?", [item.jumlah_pesanan, item.id_produksi]);
        }
      } else if (status !== 'Perlu Dikirim') {
        throw new Error("Status hanya bisa 'Dibatalkan' atau 'Perlu Dikirim'.");
      }

      await dbConnection.query(`UPDATE pesanan SET status = ? WHERE id = ?`, [status, id]);
      await dbConnection.commit();

      res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status}.` });
    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in konfirmasiPembatalan:', error);
      res.status(500).json({ success: false, message: `Kesalahan Server Internal: ${error.message}` });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  },
};

module.exports = pembatalanController;