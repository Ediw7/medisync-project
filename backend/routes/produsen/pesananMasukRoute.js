/* File: routes/produsen/pesananMasukRoute.js */
const express = require('express');
const router = express.Router();
const pesananMasukController = require('../../controllers/produsen/pesananMasukController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- MIDDLEWARE AUTH ---
// Semua rute di sini dilindungi dan hanya untuk Produsen
router.use(authenticateToken, authorizeRole('produsen'));

// --- KONFIGURASI MULTER (Untuk Bukti Pengembalian Diterima) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_pengembalian_diterima';
    // Gunakan fs untuk memastikan folder ada
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `produsen-receipt-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

// --- ROUTE DEFINITIONS ---

// 1. GET ALL
// Mengambil semua pesanan masuk untuk produsen yang sedang login
router.get('/', pesananMasukController.getAll);

// 2. GET MASSAL DETAILS (Untuk Checkbox/Select banyak)
router.post('/detail-pesanan-massal', pesananMasukController.getMassalDetails);

// 3. GET SINGLE DETAIL
// Mengambil detail pesanan berdasarkan ID
router.get('/:id', pesananMasukController.getPesananById);

// 4. GET SURAT JALAN
// Mengambil data surat jalan berdasarkan ID pesanan
router.get('/:id/surat-jalan', pesananMasukController.getSuratJalanById);

// 5. UPDATE STATUS / KIRIM PESANAN (CORE SINGLE)
// Mengubah status pesanan menjadi 'Dikirim' + Mencatat ke Blockchain
router.put('/:id/status', pesananMasukController.updateStatusWithDetails);

// 6. PROSES PENGIRIMAN MASSAL (CORE MASSAL)
router.post('/proses-pengiriman-massal', pesananMasukController.prosesPengirimanMassal);

// --- FITUR PENGEMBALIAN / RETUR ---

// 7. Get Detail Pengembalian
router.get('/pengembalian/:id', pesananMasukController.getDetailPengembalian);

// 8. Approve Pengembalian (Setuju Retur)
router.put('/pengembalian/:id/approve', pesananMasukController.approvePengembalian);

// 9. Reject Pengembalian (Tolak Retur)
router.put('/pengembalian/:id/reject', pesananMasukController.rejectPengembalian);

// 10. Lacak Status Pengembalian
router.get('/lacak-pengembalian/:id', pesananMasukController.getLacakPengembalian);

// 11. Konfirmasi Barang Retur Diterima (Upload Bukti)
router.put(
  '/lacak-pengembalian/:id/konfirmasi', 
  upload.single('buktiFoto'), // Middleware multer
  pesananMasukController.confirmReturnReceipt
);

module.exports = router;