// backend/routes/pbf/stokRoute.js
const express = require('express');
const router = express.Router();
const stokController = require('../../controllers/pbf/stokController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Lindungi route ini hanya untuk PBF
router.use(authenticateToken, authorizeRole('pbf'));

// Route untuk mengambil semua data stok dan statistik
router.get('/', stokController.getStokData);
router.get('/detail/:id', stokController.getStokDetailById);

module.exports = router;