const express = require('express');
const router = express.Router();
const penerimaanController = require('../../controllers/apotek/penerimaanController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Konfigurasi Multer untuk upload bukti penerimaan Apotek
const penerimaanStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_penerimaan_apotek';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `penerimaan-apotek-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage: penerimaanStorage, limits: { fileSize: 1024 * 1024 * 5 } });

// Semua rute di sini memerlukan otentikasi sebagai 'apotek'
router.use(authenticateToken, authorizeRole('apotek'));

// Endpoint untuk konfirmasi penerimaan
router.put(
    '/konfirmasi/:id', 
    upload.single('buktiFoto'), 
    penerimaanController.confirmPenerimaan
);

module.exports = router;