// backend/routes/riwayatRoute.js
const express = require('express');
const router = express.Router();
const riwayatController = require('../../controllers/pbf/riwayatController'); // Adjust path if needed
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Terapkan middleware untuk melindungi rute ini
router.use(authenticateToken, authorizeRole('pbf'));

// Rute untuk mendapatkan riwayat pengiriman berdasarkan ID Pesanan
router.get('/pengiriman/:pesananId', riwayatController.getRiwayatPengiriman);

module.exports = router;