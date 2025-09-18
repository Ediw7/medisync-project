const express = require('express');
const router = express.Router();
const pesananMasukController = require('../../controllers/produsen/pesananMasukController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Semua rute di sini dilindungi dan hanya untuk Produsen
router.use(authenticateToken, authorizeRole('produsen'));

// Mengambil semua pesanan masuk untuk produsen yang sedang login
router.get('/', pesananMasukController.getAll);

// Mengambil detail pesanan berdasarkan ID
router.get('/:id', pesananMasukController.getPesananById);

// Mengambil data surat jalan berdasarkan ID pesanan
router.get('/:id/surat-jalan', pesananMasukController.getSuratJalanById);


router.put('/:id/status', pesananMasukController.updateStatus);

// Rute khusus untuk mengatur pengiriman (dengan detail)
router.put('/:id/atur-pengiriman', pesananMasukController.updateStatusWithDetails);


// Mencatat pengiriman ke blockchain
router.post('/:id/record-to-blockchain', pesananMasukController.recordToBlockchainForShipment);

module.exports = router;