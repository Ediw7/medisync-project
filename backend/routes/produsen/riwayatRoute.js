const express = require('express');
const router = express.Router();
const riwayatController = require('../../controllers/produsen/riwayatController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Rute ini dilindungi dan hanya untuk Produsen
router.get('/:assetId', authenticateToken, authorizeRole('produsen'), riwayatController.getRiwayatByAssetId);

module.exports = router;