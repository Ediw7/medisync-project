'use strict';
const db = require('../../config/db');

const batalkanController = {

  /**
   * Mengajukan pembatalan untuk pesanan Apotek.
   * Dipanggil oleh Apotek.
   */
  requestPembatalan: async (req, res) => {
    // Ambil ID pesanan dari parameter URL
    const { id } = req.params; 
    const { alasan } = req.body;
    // Ambil ID apotek dari token yang sudah diverifikasi
    const idApotek = req.user.id; 

    if (!alasan || alasan.trim() === '') {
      return res.status(400).json({ success: false, message: 'Alasan pembatalan wajib diisi.' });
    }

    let dbConnection;
    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // 1. Cek apakah pesanan ini milik apotek yang login
      const [pesanan] = await dbConnection.query(
        "SELECT id, status, id_pbf FROM pesanan_apotek WHERE id = ? AND id_apotek = ?",
        [id, idApotek]
      );

      if (pesanan.length === 0) {
        await dbConnection.rollback();
        return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan atau Anda tidak berwenang." });
      }

      // 2. Cek apakah statusnya valid untuk dibatalkan
      const statusPesanan = pesanan[0].status;
      if (statusPesanan !== 'Menunggu Konfirmasi' && statusPesanan !== 'Perlu Dikirim') {
        await dbConnection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Pesanan dengan status "${statusPesanan}" tidak dapat dibatalkan.` 
        });
      }

      // 3. Update status pesanan di database
      const catatanPembatalan = `Dibatalkan oleh Apotek. Alasan: ${alasan}`;
      
      await dbConnection.query(
        "UPDATE pesanan_apotek SET status = 'Pembatalan Diajukan', catatan_khusus = ? WHERE id = ?",
        [catatanPembatalan, id]
      );
      
      await dbConnection.commit();
      res.json({ success: true, message: "Pengajuan pembatalan berhasil dikirim ke PBF." });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      console.error('Error in requestPembatalan (Apotek):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal', error: error.message });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  }
  
};

module.exports = batalkanController;