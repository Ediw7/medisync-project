const express = require('express');
const router = express.Router();
const riwayatController = require('../../controllers/produsen/riwayatController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// 🔐 Semua route di bawah hanya bisa diakses produsen yang login
router.use(authenticateToken, authorizeRole('produsen'));

// 📌 Ambil semua riwayat distribusi (off-chain)
router.get('/', riwayatController.getAllRiwayat);

// 📌 Ambil detail riwayat by assetId (on-chain + off-chain)
router.get('/:assetId', riwayatController.getRiwayatByAssetId);

module.exports = router;
