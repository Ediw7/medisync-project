const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/apotek/dashboardController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Middleware untuk memastikan hanya peran 'apotek' yang bisa mengakses
router.use(authenticateToken, authorizeRole('apotek'));

// Route utama untuk mengambil data dashboard
// GET /api/apotek/dashboard/
router.get('/', dashboardController.getDashboardData);

module.exports = router;