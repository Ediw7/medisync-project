// backend/routes/pbf/laporanRoute.js
const express = require('express');
const router = express.Router();
const laporanController = require('../../controllers/pbf/laporanController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Semua rute di sini dilindungi dan hanya untuk PBF
router.use(authenticateToken, authorizeRole('pbf'));

// --- RUTE LAPORAN PRODUSEN ---
router.get('/pemesanan-bulanan-produsen', laporanController.getPemesananBulananProdusen);
router.get('/transaksi-per-produsen', laporanController.getTransaksiPerProdusen);
router.get('/riwayat-produsen', laporanController.getRiwayatProdusen);

// --- RUTE LAPORAN APOTEK ---
router.get('/distribusi-bulanan-apotek', laporanController.getDistribusiBulananApotek);
router.get('/transaksi-per-apotek', laporanController.getTransaksiPerApotek);
router.get('/riwayat-apotek', laporanController.getRiwayatApotek);

module.exports = router;