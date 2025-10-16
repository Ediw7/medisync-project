'use strict';
const db = require('../../config/db');

const distribusiController = {
  getRiwayatDistribusi: async (req, res) => {
    const idPbf = req.user.id;
    try {
      // Query ini mengambil semua pesanan dari apotek yang statusnya sudah 'Dikirim' atau 'Selesai'
      // Ini secara efektif adalah riwayat distribusi dari PBF ke Apotek
      const sql = `
        SELECT 
            pa.id,
            pa.nomor_pesanan,
            pa.nama_apotek,
            sjp.nomor_surat_jalan,
            sjp.tanggal_pengiriman,
            pa.status,
            (SELECT SUM(dpa.jumlah) FROM detail_pesanan_apotek dpa WHERE dpa.id_pesanan_apotek = pa.id) AS jumlah_total_obat
        FROM pesanan_apotek pa
        LEFT JOIN surat_jalan_pbf sjp ON pa.id = sjp.id_pesanan_apotek
        WHERE pa.id_pbf = ? AND pa.status IN ('Dikirim', 'Selesai')
        ORDER BY sjp.tanggal_pengiriman DESC, pa.id DESC;
      `;

      const [rows] = await db.query(sql, [idPbf]);
      res.json({ success: true, data: rows });

    } catch (error) {
      console.error('Error fetching PBF distribution history:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },
};

module.exports = distribusiController;