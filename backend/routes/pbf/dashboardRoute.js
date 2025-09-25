// backend/routes/pbf/dashboardRoute.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/pbf/dashboardController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Lindungi route ini hanya untuk PBF
router.use(authenticateToken, authorizeRole('pbf'));

// Route untuk mengambil semua data dasbor
router.get('/', dashboardController.getDashboardData);

module.exports = router;