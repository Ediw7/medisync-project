const express = require('express');
const router = express.Router();
const pesananMasukController = require('../../controllers/produsen/pesananMasukController');
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Semua rute di sini dilindungi dan hanya untuk Produsen
router.use(authenticateToken, authorizeRole('produsen'));

// Mengambil semua pesanan masuk untuk produsen yang sedang login
router.get('/', pesananMasukController.getAll);

// Mengambil detail pesanan berdasarkan ID (untuk detail & konfirmasi pembatalan)
router.get('/:id', pesananMasukController.getPesananById);



// Mengambil data surat jalan berdasarkan ID pesanan
router.get('/:id/surat-jalan', pesananMasukController.getSuratJalanById);

// --- PERBAIKAN ---

// 1. Rute untuk pembaruan status SEDERHANA
// (Digunakan oleh halaman Konfirmasi Pembatalan untuk set 'Dibatalkan' atau 'Perlu Dikirim')
router.put('/:id/status', pesananMasukController.updateStatus);

// 2. Rute KHUSUS untuk mengatur pengiriman (dengan detail)
// (Digunakan oleh halaman 'Atur Pengiriman' untuk set 'Dikirim' + data resi)
router.put('/:id/atur-pengiriman', pesananMasukController.updateStatusWithDetails);

// --- AKHIR PERBAIKAN ---

// Mencatat pengiriman ke blockchain (dipanggil otomatis oleh updateStatusWithDetails)
// Rute ini mungkin tidak perlu dipanggil langsung dari frontend jika sudah otomatis,
// tapi kita biarkan jika ada keperluan manual.
router.post('/:id/record-to-blockchain', pesananMasukController.recordToBlockchainForShipment);

module.exports = router;