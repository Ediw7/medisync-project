const express = require('express');
const router = express.Router();
const pengembalianController = require('../controllers/pbf/pengembalianController'); // <-- Panggil controller baru
const { authenticateToken, authorizeRole } = require('../middleware/auth'); // Sesuaikan path middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Konfigurasi Multer untuk Bukti Penerimaan PBF ---
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, JPEG) yang diizinkan!'), false);
  }
};

const penerimaanPbfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_penerimaan_pbf'; // Folder baru untuk bukti PBF
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `pbf-terima-retur-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});
const uploadPenerimaanPbf = multer({ 
  storage: penerimaanPbfStorage, 
  fileFilter: imageFileFilter, 
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});
// --- Akhir Konfigurasi Multer ---

// Terapkan middleware otentikasi PBF
router.use(authenticateToken, authorizeRole('pbf'));

/**
 * Rute: PUT /api/pbf/pengembalian/:id/selesaikan
 * Fungsi: PBF mengkonfirmasi penerimaan barang retur dari Apotek.
 */
router.put(
  '/:id/selesaikan', 
  uploadPenerimaanPbf.single('buktiPenerimaanPbf'), // Nama field dari FormData
  pengembalianController.selesaikanPengembalian
);

module.exports = router;