const express = require('express');
const router = express.Router();
const pesananController = require('../../controllers/pbf/pesananController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

router.use(authenticateToken, authorizeRole('pbf'));

router.get('/', pesananController.getAll);
router.get('/:id', pesananController.getById);
router.post('/', pesananController.create);
router.get('/stok/:idProdusen', pesananController.getStokFromBlockchain);
router.put('/:id/request-batalkan', pesananController.requestPembatalan);
router.put('/:id/konfirmasi-pembatalan', pesananController.konfirmasiPembatalan);
router.get('/riwayat/:assetId', pesananController.getRiwayatByAssetId);


const { uploadMiddleware } = pesananController;
router.put('/:id/konfirmasi', uploadMiddleware.single('buktiFoto'), pesananController.konfirmasiPenerimaan);
router.put('/:id/ajukan-pengembalian', pesananController.uploadMiddleware.single('buktiFoto'), pesananController.ajukanPengembalian);

module.exports = router;