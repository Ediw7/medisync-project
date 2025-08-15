const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Endpoint ini tidak memerlukan token otentikasi
router.get('/riwayat/:batchId', publicController.getRiwayatObat);

module.exports = router;
