const express = require('express');
const router = express.Router();
const penjualanController = require('../../controllers/apotek/penjualanController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Semua rute di sini dilindungi dan hanya untuk Apotek
router.use(authenticateToken, authorizeRole('apotek'));

// GET /api/apotek/penjualan/stok
// Mengambil semua stok yang siap dijual oleh apotek (dari blockchain)
router.get('/stok', penjualanController.getStokApotek);

// POST /api/apotek/penjualan/proses
// Memproses transaksi penjualan
router.post('/proses', penjualanController.prosesPenjualan);

// GET /api/apotek/penjualan/riwayat
// Mengambil daftar semua penjualan
router.get('/riwayat', penjualanController.getAllPenjualan);

// GET /api/apotek/penjualan/riwayat/:id
// Mengambil detail satu penjualan
router.get('/riwayat/:id', penjualanController.getDetailPenjualan);

module.exports = router;