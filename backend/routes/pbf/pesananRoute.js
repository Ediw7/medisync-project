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

// --- TAMBAHAN YANG HILANG (PERBAIKAN) ---

// 1. Rute untuk mengambil data stok dari Blockchain/CouchDB (diperlukan oleh halaman 'Create')
// (Controller Anda mengharapkan 'idProdusen' dari params)
router.get('/stok/:idProdusen', pesananController.getStokFromBlockchain);
// Rute untuk aksi PBF
router.put('/:id/request-batalkan', pesananController.requestPembatalan);

// --- PERBAIKAN UTAMA DI SINI ---
// Gunakan middleware 'upload.single' SEBELUM memanggil controller
router.put('/:id/ajukan-pengembalian', pesananController.uploadMiddleware.single('buktiFoto'), pesananController.ajukanPengembalian);

module.exports = router;