const express = require('express');
const router = express.Router();
const penerimaanController = require('../../controllers/pbf/penerimaanController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Hanya file JPG, PNG, atau JPEG yang diizinkan.'));
  },
});

// Terapkan middleware untuk melindungi semua rute
router.use(authenticateToken, authorizeRole('pbf'));

// Rute untuk mengonfirmasi penerimaan pesanan dengan unggah foto
router.put('/:id/konfirmasi', upload.single('buktiFoto'), penerimaanController.confirmPenerimaan);

// Rute untuk mengonfirmasi pesanan
router.put('/:id/konfirmasi-pesanan', penerimaanController.confirmPesanan);

module.exports = router;