/* File: routes/produsen/produsenRoute.js */
const express = require('express');
const router = express.Router();
// Pastikan file controller Anda bernama produksiController.js atau sesuaikan require ini
const produksiController = require('../../controllers/produsen/produksiController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- KONFIGURASI MULTER (UPLOAD FILE) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        // Pastikan folder uploads ada
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Penamaan file unik: fieldname-timestamp.ext
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB (Opsional)
});

// --- MIDDLEWARE AUTH ---
// Semua rute di bawah ini dilindungi (Wajib Login & Role Produsen)
router.use(authenticateToken, authorizeRole('produsen'));

// --- DEFINISI RUTE ---

// 1. Get All Data
router.get('/jadwal', produksiController.getAll);

// 2. Get By ID
router.get('/:id', produksiController.getById);

// 3. CREATE / PRODUKSI OBAT (REVISI UTAMA)
// URL: POST /api/produsen/produksi
// Menggunakan upload.fields karena mungkin ada upload dokumen BPOM/Sertifikat
router.post('/produksi', upload.fields([
    { name: 'dokumen_bpom', maxCount: 1 },
    { name: 'sertifikat_analisis', maxCount: 1 }
]), produksiController.create); 
// Catatan: Pastikan fungsi 'create' di produksiController sudah berisi logika PDC yang kita bahas tadi.

// 4. Update Data
router.put('/:id', upload.fields([
    { name: 'dokumen_bpom', maxCount: 1 },
    { name: 'sertifikat_analisis', maxCount: 1 }
]), produksiController.update);

// 5. Delete Data
router.delete('/:id', produksiController.delete);

// 6. Record to Blockchain (Manual Trigger jika perlu)
router.post('/:id/record', produksiController.recordToBlockchain);

// 7. Get QR Data
router.get('/qr-data/:batch_id', produksiController.getQrData);

// 8. Get Blockchain Detail (Untuk verifikasi data)
router.get('/blockchain-detail/:batch_id', produksiController.getBlockchainDetail);

// 9. (Tambahan) Route Read khusus untuk testing PDC (Opsional)
// Jika Anda menambahkan fungsi getObatById di controller tadi
if (produksiController.getObatById) {
    router.get('/obat/:idBatch', produksiController.getObatById);
}

module.exports = router;