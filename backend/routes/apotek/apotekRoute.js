const express = require('express');
const router = express.Router();
const apotekController = require('../../controllers/apotek/apotekController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Semua rute di sini memerlukan otentikasi sebagai 'apotek'
router.use(authenticateToken, authorizeRole('apotek'));

// Mendapatkan daftar semua PBF
router.get('/pbf', apotekController.getPbfList);

// Mendapatkan stok tersedia dari PBF tertentu
router.get('/pbf/:idPbf/stok', apotekController.getAvailableStockByPbf);

// Membuat pesanan baru ke PBF
router.post('/pesanan', apotekController.createPesanan);
router.get('/pesanan', apotekController.getAllPesanan);

// Mendapatkan profil apotek yang login
router.get('/profile', apotekController.getProfile);

module.exports = router;