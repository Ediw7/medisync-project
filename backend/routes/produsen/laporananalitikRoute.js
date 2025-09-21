const express = require('express');
const router = express.Router();
const laporananalitikController = require('../../controllers/produsen/laporananalitikController');
const { authenticateToken } = require('../../middleware/auth'); // ambil langsung function

// Rute untuk mendapatkan data analitik untuk produsen yang sudah login
router.get('/laporananalitik', authenticateToken, laporananalitikController.getAnalyticsData);

module.exports = router;