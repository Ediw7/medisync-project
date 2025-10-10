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
router.get('/stok', apotekController.getStokObat);

// Rute terkait pesanan
router.post('/pesanan', apotekController.createPesanan);
router.get('/pesanan', apotekController.getAllPesanan);
router.get('/pesanan/:id', apotekController.getPesananById); // Untuk melihat detail
router.get('/pesanan/riwayat/:assetId', apotekController.getRiwayatByAssetId);
// router.put('/pesanan/:id/request-batalkan', apotekController.requestPembatalan); // Jika ada

// Mendapatkan profil apotek yang login
router.get('/profile', apotekController.getProfile);

module.exports = router;