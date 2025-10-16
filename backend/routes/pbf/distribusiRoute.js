const express = require('express');
const router = express.Router();
const distribusiController = require('../../controllers/pbf/distribusiController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Rute ini dilindungi dan hanya bisa diakses oleh PBF yang login
router.get('/', authenticateToken, authorizeRole('pbf'), distribusiController.getRiwayatDistribusi);

module.exports = router;