const express = require('express');
const router = express.Router();
const batalkanController = require('../../controllers/apotek/batalkanController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Terapkan middleware otentikasi untuk semua rute di file ini
router.use(authenticateToken, authorizeRole('apotek'));

/**
 * Rute: PUT /api/apotek/batalkan/:id
 * Fungsi: Mengajukan pembatalan pesanan berdasarkan ID pesanan.
 */
router.put('/:id', batalkanController.requestPembatalan);

module.exports = router;