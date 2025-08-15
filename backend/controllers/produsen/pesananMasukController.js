const db = require('../../config/db');

const pesananMasukController = {
  // Mengambil semua pesanan yang ditujukan ke produsen yang sedang login
  getAll: async (req, res) => {
    try {
      const idProdusen = req.user.id;
      const sql = `
        SELECT 
          p.id,
          p.nomor_po,
          pbf.nama_resmi AS nama_pbf,
          pbf.alamat AS alamat_pbf,
          COALESCE(
            (SELECT SUM(dp.total_harga) FROM detail_pesanan dp WHERE dp.id_pesanan = p.id),
            0
          ) AS total_harga,
          p.status,
          p.tanggal_pesanan
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        WHERE p.id_produsen = ? AND pbf.role = 'pbf'
        ORDER BY p.tanggal_pesanan DESC
      `;
      const [rows] = await db.query(sql, [idProdusen]);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error in getAll pesanan masuk:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
  },

  // Mengambil detail pesanan berdasarkan ID
  getPesananById: async (req, res) => {
    try {
      const { id } = req.params;
      const idProdusen = req.user.id;
      const sqlPesanan = `
        SELECT 
          p.id,
          p.nomor_po,
          pbf.nama_resmi AS nama_pbf,
          pbf.alamat AS alamat_pbf,
          pbf.nomor_izin AS siup_pbf,
          COALESCE(
            (SELECT SUM(dp.total_harga) FROM detail_pesanan dp WHERE dp.id_pesanan = p.id),
            0
          ) AS total_harga,
          p.status,
          p.tanggal_pesanan,
          p.tujuan_distribusi,
          p.catatan_khusus
        FROM pesanan p
        JOIN users pbf ON p.id_pbf = pbf.id
        WHERE p.id = ? AND p.id_produsen = ? AND pbf.role = 'pbf'
      `;
      const [pesanan] = await db.query(sqlPesanan, [id, idProdusen]);
      if (pesanan.length === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
      }

      const sqlDetail = `
        SELECT 
          dp.id,
          dp.nama_obat,
          dp.bentuk_sediaan,
          dp.dosis,
          dp.jumlah_pesanan,
          dp.harga_per_unit,
          dp.total_harga,
          pr.batch_id
        FROM detail_pesanan dp
        LEFT JOIN produksi pr ON dp.id_produksi = pr.id
        WHERE dp.id_pesanan = ?
      `;
      const [detail] = await db.query(sqlDetail, [id]);

      res.json({
        success: true,
        data: {
          pesanan: pesanan[0],
          detail_pesanan: detail,
        },
      });
    } catch (error) {
      console.error('Error in getPesananById:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
  },

// Mengupdate status pesanan
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const idProdusen = req.user.id;
      const validStatuses = ['Perlu Dikirim', 'Dikirim', 'Selesai', 'Ditolak', 'Dikembalikan'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid. Gunakan: ' + validStatuses.join(', ') });
      }

      const [result] = await db.query(
        `UPDATE pesanan SET status = ? WHERE id = ? AND id_produsen = ?`,
        [status, id, idProdusen]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
      }

      res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status}.` });
    } catch (error) {
      console.error('Error in updateStatus:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
  },

  // Mengupdate status pesanan dengan detail tambahan (untuk atur pengiriman)
  updateStatusWithDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, tanggalPengiriman, catatan } = req.body;
      const idProdusen = req.user.id;
      const validStatuses = ['Dikirim', 'Selesai']; // Hanya status yang diperbolehkan untuk atur pengiriman

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status tidak valid untuk atur pengiriman. Gunakan: ' + validStatuses.join(', ') });
      }

      if (!tanggalPengiriman) {
        return res.status(400).json({ success: false, message: 'Tanggal pengiriman wajib diisi.' });
      }

      const [result] = await db.query(
        `UPDATE pesanan SET status = ?, tanggal_pengiriman = ?, catatan = ? WHERE id = ? AND id_produsen = ?`,
        [status, tanggalPengiriman, catatan || null, id, idProdusen]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
      }

      res.json({ success: true, message: `Status pesanan berhasil diubah menjadi ${status}.` });
    } catch (error) {
      console.error('Error in updateStatusWithDetails:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal: ' + error.message });
    }
  },
};

module.exports = pesananMasukController;