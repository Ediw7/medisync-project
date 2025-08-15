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

// Mengubah status pesanan dengan detail tambahan (misalnya untuk atur pengiriman)
router.put('/:id/status', pesananMasukController.updateStatusWithDetails);

module.exports = router;