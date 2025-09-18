const express = require('express');
const router = express.Router();
const pembatalanController = require('../../controllers/produsen/pembatalanController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.use(authenticateToken, authorizeRole('produsen'));

// Konfirmasi pembatalan
router.put('/:id/konfirmasi-pembatalan', pembatalanController.konfirmasiPembatalan);

module.exports = router;