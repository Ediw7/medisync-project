'use strict';
const db = require('../../config/db');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const pengembalianController = {

  /**
   * PBF Menyelesaikan Pengembalian (setelah menerima barang retur).
   * PUT /api/pbf/pengembalian/:id/selesaikan
   */
  selesaikanPengembalian: async (req, res) => {
    const { id } = req.params; // id_pesanan_apotek
    const idPbf = req.user.id;
    const buktiFoto = req.file; // Bukti foto dari PBF

    if (!buktiFoto) {
      return res.status(400).json({ success: false, message: 'Bukti foto penerimaan (oleh PBF) wajib diunggah.' });
    }

    const buktiFotoPath = buktiFoto.path.replace(/\\/g, '/');
    let dbConnection;

    try {
      dbConnection = await db.getConnection();
      await dbConnection.beginTransaction();

      // 1. Cek apakah pesanan ini milik PBF yang login
      const [pesanan] = await dbConnection.query(
        "SELECT id, status FROM pesanan_apotek WHERE id = ? AND id_pbf = ?",
        [id, idPbf]
      );

      if (pesanan.length === 0) {
        await dbConnection.rollback();
        return res.status(404).json({ success: false, message: "Pesanan tidak ditemukan atau Anda tidak berwenang." });
      }

      // 2. Cek apakah statusnya 'Dikembalikan'
      const statusPesanan = pesanan[0].status;
      if (statusPesanan !== 'Dikembalikan') {
        await dbConnection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Hanya pesanan berstatus "Dikembalikan" yang dapat diselesaikan. Status saat ini: "${statusPesanan}".` 
        });
      }

      // 3. Update status pesanan dan simpan bukti foto PBF
      // Kita simpan di 'bukti_foto' (asumsi 'bukti_foto_pengembalian' untuk Apotek)
      // Jika Anda tidak punya kolom 'bukti_penerimaan_pbf', tambahkan ke catatan_khusus
      
      const catatanUpdate = `\n[PENGEMBALIAN SELESAI]: Barang retur diterima PBF. Bukti PBF: ${buktiFotoPath}`;
      
      await dbConnection.query(
        "UPDATE pesanan_apotek SET status = 'Pengembalian Selesai', catatan_khusus = CONCAT(IFNULL(catatan_khusus, ''), ?), bukti_foto = ? WHERE id = ?",
        [catatanUpdate, buktiFotoPath, id]
      );
      
      // TODO (PENTING): Kembalikan stok ke PBF atau Panggil Chaincode
      // 1. Ambil detail pesanan yang dikembalikan
      // 2. Loop detail
      // 3. Panggil chaincode PbfContract:terimaBarangRetur(assetId, jumlah, hashBuktiPbf)
      // 4. Update stok PBF di database MySQL

      await dbConnection.commit();
      res.json({ success: true, message: "Pengembalian berhasil diselesaikan." });

    } catch (error) {
      if (dbConnection) await dbConnection.rollback();
      try {
        await fs.unlink(buktiFotoPath);
      } catch (e) {
        console.error("Gagal menghapus file setelah error:", e.message);
      }
      console.error('Error in selesaikanPengembalian (PBF):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal', error: error.message });
    } finally {
      if (dbConnection) dbConnection.release();
    }
  }
};

module.exports = pengembalianController;