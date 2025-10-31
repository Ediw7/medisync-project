const express = require('express');
const router = express.Router();
const pesananController = require('../../controllers/pbf/pesananController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.use(authenticateToken, authorizeRole('pbf'));

// Ambil kedua middleware yang sudah diekspor dari controller
const { 
  uploadPenerimaanMiddleware, 
  uploadPengembalianMiddleware 
} = pesananController;

// Rute standar
router.get('/', pesananController.getAll);
router.get('/:id', pesananController.getById);
router.post('/', pesananController.create);
router.get('/stok/:idProdusen', pesananController.getStokFromBlockchain);
router.put('/:id/request-batalkan', pesananController.requestPembatalan);
router.put('/:id/konfirmasi-pembatalan', pesananController.konfirmasiPembatalan);
router.get('/riwayat/:assetId', pesananController.getRiwayatByAssetId);
router.get('/:id/lacak-pengembalian', pesananController.getLacakPengembalianPbf);
// Gunakan middleware yang sesuai untuk setiap rute unggah file
router.put('/:id/konfirmasi', uploadPenerimaanMiddleware.single('buktiFoto'), pesananController.konfirmasiPenerimaan);
router.post('/:id/ajukan-pengembalian', uploadPengembalianMiddleware.single('buktiFoto'), pesananController.ajukanPengembalian);
router.put('/:id/acknowledge-rejection', pesananController.acknowledgeRejection);
module.exports = router;

