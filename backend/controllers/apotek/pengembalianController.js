'use strict';
const db = require('../../config/db');
const fs = require('fs').promises;
const path = require('path');

const pengembalianController = {

  /**
   * Mengajukan PENGEMBALIAN untuk pesanan Apotek.
   * Dipanggil oleh Apotek.
   * PUT /api/apotek/pengembalian/:id
   */
  ajukanPengembalian: async (req, res) => {
    const { id } = req.params; // id_pesanan_apotek
    const { alasan } = req.body;
    const idApotek = req.user.id;
    const buktiFoto = req.file; // Diambil dari multer

    if (!alasan || alasan.trim() === '') {
      return res.status(400).json({ success: false, message: 'Alasan pengembalian wajib diisi.' });
    }
    if (!buktiFoto) {
      return res.status(400).json({ success: false, message: 'Bukti foto wajib diunggah.' });
    }

    const buktiFotoPath = buktiFoto.path.replace(/\\/g, '/'); // Normalisasi path
    let dbConnection;

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // 1. Cek apakah pesanan ini milik apotek yang login
      const [pesanan] = await dbConnection.query(
        "SELECT id, status, catatan_khusus FROM pesanan_apotek WHERE id = ? AND id_apotek = ?",
        [id, idApotek]
      );

      if (pesanan.length === 0) {
        await dbConnection.rollback();
        return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan atau Anda tidak berwenang." });
      }

      // 2. Cek apakah statusnya valid untuk dikembalikan
      const statusPesanan = pesanan[0].status;
      if (statusPesanan !== 'Selesai' && statusPesanan !== 'Dikirim') {
        await dbConnection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Pesanan dengan status "${statusPesanan}" tidak dapat diajukan pengembalian.` 
        });
      }

      // 3. Update status pesanan di database
      const catatanLama = pesanan[0].catatan_khusus || '';
      const catatanPengembalian = `\n[PENGEMBALIAN DIAJUKAN]: ${alasan}`;
      
      await dbConnection.query(
        "UPDATE pesanan_apotek SET status = 'Pengembalian Diajukan', catatan_khusus = ?, bukti_foto_pengembalian = ? WHERE id = ?",
        [catatanLama + catatanPengembalian, buktiFotoPath, id]
      );
      
      await dbConnection.commit();
      res.json({ success: true, message: "Pengajuan pengembalian berhasil dikirim ke PBF." });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      // Hapus file yang diunggah jika terjadi error DB
      try {
        await fs.unlink(buktiFotoPath);
      } catch (e) {
        console.error("Gagal menghapus file setelah error:", e.message);
      }
      console.error('Error in ajukanPengembalian (Apotek):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal', error: error.message });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  }
  
};

module.exports = pengembalianController;