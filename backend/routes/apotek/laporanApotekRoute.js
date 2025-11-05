const express = require('express');
const router = express.Router();
const laporanApotekController = require('../../controllers/apotek/laporanApotekController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Semua rute di sini hanya untuk Apotek
router.use(authenticateToken, authorizeRole('apotek'));

// GET /api/apotek/laporan/analytics
router.get('/analytics', laporanApotekController.getAnalyticsData);

module.exports = router;