'use strict';
const db = require('../../config/db');
// DITAMBAHKAN: Kita butuh koneksi ke blockchain lagi
const { Gateway, Wallets } = require('fabric-network'); 
const path = require('path');
const fs = require('fs');

// DITAMBAHKAN: Fungsi helper untuk koneksi ke Fabric Gateway Apotek
async function getApotekGateway() {
  const walletPath = path.resolve(__dirname, '..', '..', 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org3.json');
  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const gateway = new Gateway();
  await gateway.connect(ccp, { wallet, identity: 'apotekAdmin', discovery: { enabled: true, asLocalhost: true } });
  return gateway;
}

const dashboardController = {
  getDashboardData: async (req, res) => {
    const idApotek = req.user.id;
    let gateway; // Definisikan gateway di luar try block

    try {
      // --- 1. Statistik Pesanan Aktif (dari MySQL) ---
      const [statsPesanan] = await db.query(`
        SELECT COUNT(*) as pesananAktif
        FROM pesanan_apotek
        WHERE id_apotek = ? AND status NOT IN ('Selesai', 'Dibatalkan')
      `, [idApotek]);

      // --- 2. Statistik Total Stok (dari MySQL, berdasarkan pesanan 'Selesai') ---
      const [statsStok] = await db.query(`
        SELECT SUM(dpa.jumlah) as totalStok
        FROM detail_pesanan_apotek dpa
        JOIN pesanan_apotek pa ON dpa.id_pesanan_apotek = pa.id
        WHERE pa.id_apotek = ? AND pa.status = 'Selesai'
      `, [idApotek]);
      
      // --- 3. DIUBAH TOTAL: Logika untuk Stok Obat Terbaru ---
      // Langkah A: Ambil daftar stok terbaru dari MySQL untuk mendapatkan ID Batch
      const [stokTerbaruRows] = await db.query(`
        SELECT
          dpa.nama_obat as namaObat,
          dpa.id_aset_blockchain as batchId,
          dpa.jumlah as stok
        FROM detail_pesanan_apotek dpa
        JOIN pesanan_apotek pa ON dpa.id_pesanan_apotek = pa.id
        WHERE pa.id_apotek = ? AND pa.status = 'Selesai'
        ORDER BY pa.tanggal_pesanan DESC
        LIMIT 5
      `, [idApotek]);
      
      let stokTerbaru = [];
      // Langkah B: Jika ada hasilnya, ambil detail dari blockchain
      if (stokTerbaruRows.length > 0) {
        gateway = await getApotekGateway();
        const network = await gateway.getNetwork('medisyncchannel');
        const contract = network.getContract('medisync');

        // Gunakan Promise.all untuk mengambil data secara paralel agar lebih cepat
        stokTerbaru = await Promise.all(stokTerbaruRows.map(async (item) => {
          try {
            const assetBuffer = await contract.evaluateTransaction('ProdusenContract:readObat', item.batchId);
            const onChainData = JSON.parse(assetBuffer.toString());

            const tgl = new Date(onChainData.tanggalKadaluarsa);
            const kadaluarsaFormatted = onChainData.tanggalKadaluarsa && !isNaN(tgl.getTime())
              ? tgl.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : 'N/A';
            
            return { ...item, kadaluarsa: kadaluarsaFormatted };
          } catch (err) {
            console.error(`Gagal mengambil detail on-chain untuk ${item.batchId}:`, err);
            return { ...item, kadaluarsa: 'Error' }; // Fallback jika gagal
          }
        }));
      }

      // --- 4. Pesanan Terbaru (dari MySQL) ---
      const [pesananTerbaruRows] = await db.query(`
        SELECT 
          id, tanggal_pesanan, status,
          (SELECT GROUP_CONCAT(dpa.nama_obat SEPARATOR ', ') FROM detail_pesanan_apotek dpa WHERE dpa.id_pesanan_apotek = pa.id) as nama_obat,
          (SELECT SUM(dpa.jumlah) FROM detail_pesanan_apotek dpa WHERE dpa.id_pesanan_apotek = pa.id) as total_jumlah
        FROM pesanan_apotek pa WHERE pa.id_apotek = ? ORDER BY pa.tanggal_pesanan DESC LIMIT 5
      `, [idApotek]);

       const pesananTerbaru = pesananTerbaruRows.map(p => ({
          id: p.id,
          tanggal: new Date(p.tanggal_pesanan).toLocaleDateString('id-ID'),
          obat: p.nama_obat || 'N/A',
          jumlah: p.total_jumlah || 0,
          status: p.status
      }));

      // --- 5 & 6. Gabungkan semua data ---
      const penjualanHariIni = 0; 
      const akanKadaluarsa = 0; 

      const responseData = {
        stats: {
          totalStok: statsStok[0].totalStok || 0,
          penjualanHariIni: penjualanHariIni,
          pesananAktif: statsPesanan[0].pesananAktif || 0,
          akanKadaluarsa: akanKadaluarsa,
        },
        stokTerbaru: stokTerbaru,
        pesananTerbaru: pesananTerbaru,
      };

      res.json({ success: true, data: responseData });

    } catch (error) {
      console.error('>>> [ERROR] Gagal mengambil data dasbor Apotek:', error);
      res.status(500).json({ success: false, message: 'Gagal mengambil data dasbor.' });
    } finally {
      // Pastikan gateway ditutup setelah selesai
      if (gateway) gateway.disconnect();
    }
  }
};

module.exports = dashboardController;