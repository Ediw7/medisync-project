const express = require('express');
const router = express.Router();
const pesananApotekController = require('../../controllers/pbf/pesananApotekController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Untuk PBF yang login
router.get('/', authenticateToken, authorizeRole('pbf'), pesananApotekController.getAllPesananMasuk);

// Untuk Apotek yang login
router.post('/', authenticateToken, authorizeRole('apotek'), pesananApotekController.createPesanan);

module.exports = router;