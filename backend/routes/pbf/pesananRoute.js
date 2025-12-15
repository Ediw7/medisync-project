const express = require('express');
const router = express.Router();
const pesananController = require('../../controllers/pbf/pesananController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Middleware: Wajib Login & Role PBF
router.use(authenticateToken, authorizeRole('pbf'));

// --- DEFINISI RUTE ---

// 1. Ambil Semua Pesanan Saya (PBF)
// URL: GET /api/pbf/pesanan
router.get('/', pesananController.getAll);

// 2. Buat Pesanan Baru (Purchase Order)
// URL: POST /api/pbf/pesanan/buat
router.post('/buat', pesananController.create);

// 3. Ambil Detail Pesanan per ID
// URL: GET /api/pbf/pesanan/:id
router.get('/:id', pesananController.getById);

// 4. Konfirmasi Penerimaan Barang (Upload Bukti & Blockchain)
// URL: POST /api/pbf/pesanan/:id/terima
router.post('/:id/terima', 
    pesananController.uploadPenerimaanMiddleware.single('bukti_foto'), 
    pesananController.konfirmasiPenerimaan
);

// 5. Ajukan Pembatalan
router.post('/:id/batal', pesananController.requestPembatalan);

// 6. Ajukan Pengembalian (Retur)
router.post('/:id/kembali', 
    pesananController.uploadPengembalianMiddleware.single('bukti_foto'), 
    pesananController.ajukanPengembalian
);

// 7. Lacak Aset (Riwayat Blockchain)
// URL: GET /api/pbf/pesanan/lacak/:assetId
router.get('/lacak/:assetId', pesananController.getRiwayatByAssetId);

module.exports = router;