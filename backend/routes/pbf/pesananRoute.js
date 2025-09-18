const express = require('express');
const router = express.Router();
const pesananController = require('../../controllers/pbf/pesananController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');



// Ini sudah benar. Middleware ini akan melindungi SEMUA rute di bawah ini.
router.use(authenticateToken, authorizeRole('pbf'));

// Rute yang sudah Anda miliki (Benar):
router.get('/', pesananController.getAll);
router.get('/:id', pesananController.getById); // Rute untuk detail pesanan
router.post('/', pesananController.create); // Rute untuk submit pesanan baru


router.get('/stok/:idProdusen', pesananController.getStokFromBlockchain);
// --- PERBAIKAN UTAMA DI SINI ---
// Mengubah nama rute agar cocok dengan yang dipanggil oleh frontend
router.put('/:id/request-batalkan', pesananController.requestPembatalan);
router.put('/:id/ajukan-pengembalian', pesananController.uploadMiddleware.single('buktiFoto'), pesananController.ajukanPengembalian);

module.exports = router;