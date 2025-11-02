const express = require('express');
const router = express.Router();
const pesananMasukController = require('../../controllers/produsen/pesananMasukController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

// Semua rute di sini dilindungi dan hanya untuk Produsen
router.use(authenticateToken, authorizeRole('produsen'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/bukti_pengembalian_diterima';
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `produsen-receipt-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });


// Mengambil semua pesanan masuk untuk produsen yang sedang login
router.get('/', pesananMasukController.getAll);

// Mengambil detail pesanan berdasarkan ID
router.get('/:id', pesananMasukController.getPesananById);

// Mengambil data surat jalan berdasarkan ID pesanan
router.get('/:id/surat-jalan', pesananMasukController.getSuratJalanById);

// Mengubah status pesanan dengan detail tambahan (misalnya untuk atur pengiriman)
router.put('/:id/status', pesananMasukController.updateStatusWithDetails);

router.get('/pengembalian/:id', pesananMasukController.getDetailPengembalian);
router.put('/pengembalian/:id/approve', pesananMasukController.approvePengembalian);
router.put('/pengembalian/:id/reject', pesananMasukController.rejectPengembalian);
router.get('/lacak-pengembalian/:id', pesananMasukController.getLacakPengembalian);

router.post(
  '/detail-pesanan-massal', 
  pesananMasukController.getMassalDetails
);

router.put(
  '/lacak-pengembalian/:id/konfirmasi', 
  upload.single('buktiFoto'), // Middleware multer
  pesananMasukController.confirmReturnReceipt
);
router.post('/proses-pengiriman-massal', pesananMasukController.prosesPengirimanMassal);

// Mencatat pengiriman ke blockchain
router.post('/:id/record-to-blockchain', pesananMasukController.recordToBlockchainForShipment);

module.exports = router;

