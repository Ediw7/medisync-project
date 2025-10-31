'use strict';

const db = require('../../config/db');

const pembatalanController = {
  konfirmasiPembatalan: async (req, res) => {
    console.log(`Received request for /pesanan/${req.params.id}/konfirmasi-pembatalan`);
    const { id } = req.params;
    const { status, alasan_penolakan } = req.body;// 'Dibatalkan' atau 'Perlu Dikirim'
    const idProdusen = req.user.id;

    let dbConnection;
    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      const [currentPesanan] = await dbConnection.query(
        "SELECT status, catatan_khusus FROM pesanan WHERE id = ? AND id_produsen = ?",
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
        await dbConnection.query(`UPDATE pesanan SET status = ? WHERE id = ?`, [status, id]);

      } else if (status === 'Pembatalan Ditolak') { 
        // JIKA DITOLAK
        if (!alasan_penolakan || alasan_penolakan.trim() === '') { // <-- Baris 40 sekarang aman
            throw new Error('Alasan penolakan wajib diisi saat menolak pembatalan.');
        }
        const catatanBaru = (currentPesanan[0].catatan_khusus || '') + `\n[PENOLAKAN]: ${alasan_penolakan}`;
        await dbConnection.query(`UPDATE pesanan SET status = ?, catatan_khusus = ? WHERE id = ?`, [status, catatanBaru, id]);

      } else {
        throw new Error("Status hanya bisa 'Dibatalkan' atau 'Pembatalan Ditolak'.");
      }

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