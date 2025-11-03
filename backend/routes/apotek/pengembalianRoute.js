const express = require('express');
const router = express.Router();
const pengembalianController = require('../../controllers/apotek/pengembalianController'); // <-- Panggil controller baru
const { authenticateToken, authorizeRole } = require('../../middleware/auth'); // Sesuaikan path middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Konfigurasi Multer untuk Bukti Pengembalian ---
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, JPEG) yang diizinkan!'), false);
  }
};

const pengembalianStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_pengembalian';
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `apotek-pengembalian-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});
const uploadPengembalian = multer({ 
  storage: pengembalianStorage, 
  fileFilter: imageFileFilter, 
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});
// --- Akhir Konfigurasi Multer ---


// Terapkan middleware otentikasi untuk semua rute di file ini
router.use(authenticateToken, authorizeRole('apotek'));

/**
 * Rute: PUT /api/apotek/pengembalian/:id
 * Fungsi: Mengajukan pengembalian pesanan berdasarkan ID pesanan.
 */
router.put(
  '/:id', 
  uploadPengembalian.single('buktiFotoPengembalian'), // Nama field dari FormData
  pengembalianController.ajukanPengembalian
);

module.exports = router;