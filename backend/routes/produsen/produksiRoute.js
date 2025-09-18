const express = require('express');
const router = express.Router();
const produksiController = require('../../controllers/produsen/produksiController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

// Konfigurasi Multer untuk upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Semua rute di sini dilindungi dan hanya untuk produsen
router.use(authenticateToken, authorizeRole('produsen'));

router.get('/jadwal', produksiController.getAll);
router.get('/:id', produksiController.getById);

// PERBAIKAN: Gunakan upload.fields untuk menerima beberapa file
router.post('/', upload.fields([
    { name: 'dokumen_bpom', maxCount: 1 },
    { name: 'sertifikat_analisis', maxCount: 1 }
]), produksiController.create);

router.put('/:id', upload.fields([
    { name: 'dokumen_bpom', maxCount: 1 },
    { name: 'sertifikat_analisis', maxCount: 1 }
]), produksiController.update);

router.delete('/:id', produksiController.delete);
router.post('/:id/record', produksiController.recordToBlockchain);
router.get('/qr-data/:batch_id', produksiController.getQrData); // Tambahkan kembali rute ini

router.get('/blockchain-detail/:batch_id', produksiController.getBlockchainDetail);

module.exports = router;