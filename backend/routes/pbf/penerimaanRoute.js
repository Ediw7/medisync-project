const express = require('express');
const router = express.Router();
const penerimaanController = require('../../controllers/pbf/penerimaanController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- KONFIGURASI MULTER (UPLOAD FOTO) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_penerimaan';
    // Pastikan folder ada, jika tidak buat baru
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Format nama file: penerimaan-IDPESANAN-TIMESTAMP.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `penerimaan-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Hanya file JPG, PNG, atau JPEG yang diizinkan.'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas 5MB
  fileFilter: fileFilter
});

// --- MIDDLEWARE AUTH ---
// Semua route di bawah ini dilindungi (Harus Login & Role PBF)
router.use(authenticateToken, authorizeRole('pbf'));

// --- DEFINISI ROUTE ---

// 1. Route Konfirmasi Penerimaan Barang (Upload Foto + Blockchain)
// URL: POST /api/pbf/penerimaan/:id
// Contoh: http://localhost:5000/api/pbf/penerimaan/272
router.post('/:id', upload.single('buktiFoto'), penerimaanController.confirmPenerimaan);

// 2. Route Konfirmasi Pesanan Awal (Hanya Status SQL)
// URL: PUT /api/pbf/penerimaan/:id/konfirmasi-pesanan
router.put('/:id/konfirmasi-pesanan', penerimaanController.confirmPesanan);

module.exports = router;