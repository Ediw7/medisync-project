const express = require('express');
const router = express.Router();
const pesananApotekController = require('../../controllers/pbf/pesananApotekController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');
const pesananController = require('../../controllers/pbf/pesananController');


// Untuk PBF yang login
router.get('/', authenticateToken, authorizeRole('pbf'), pesananApotekController.getAllPesananMasuk);
router.get('/:id', authenticateToken, authorizeRole('pbf'), pesananApotekController.getPesananById);

router.post(
    '/detail-pesanan-massal', 
    authenticateToken, 
    authorizeRole('pbf'), 
    pesananApotekController.getMassalDetails
);

router.put('/:id/atur-pengiriman', authenticateToken, authorizeRole('pbf'), pesananApotekController.updateStatusAndCreateSuratJalan);
router.post('/proses-pengiriman-massal', authenticateToken, authorizeRole('pbf'), pesananApotekController.prosesPengirimanMassal);

router.get('/:id/surat-jalan', authenticateToken, authorizeRole('pbf'), pesananApotekController.getSuratJalanById);
router.get('/:id/lacak', authenticateToken, authorizeRole('pbf'), pesananApotekController.getLacakPengirimanApotek);
router.put('/:id/konfirmasi-pembatalan', authenticateToken, authorizeRole('pbf'), pesananApotekController.konfirmasiPembatalan);
router.get('/riwayat/:assetId', authenticateToken, authorizeRole('pbf'), pesananController.getRiwayatByAssetId);

// Untuk Apotek yang login
router.post('/', authenticateToken, authorizeRole('apotek'), pesananApotekController.createPesanan);
// --- RUTE BARU UNTUK APOTEK MENGAJUKAN PEMBATALAN ---
router.put('/:id/request-pembatalan', authenticateToken, authorizeRole('apotek'), pesananApotekController.requestPembatalan);

router.put(
  '/pengembalian/:id/approve',
  authenticateToken, // <-- TAMBAHKAN INI
  authorizeRole('pbf'), // <-- TAMBAHKAN INI
  pesananApotekController.approvePengembalianApotek
);

router.put(
  '/pengembalian/:id/reject',
  authenticateToken, // <-- TAMBAHKAN INI
  authorizeRole('pbf'), // <-- TAMBAHKAN INI
  pesananApotekController.rejectPengembalianApotek
);
module.exports = router;
