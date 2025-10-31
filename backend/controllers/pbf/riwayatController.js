'use strict';

const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs').promises;
const db = require('../../config/db');

// Fungsi getGateway() Anda sudah benar (tidak saya ubah)
async function getGateway() {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Pastikan 'pbfAdmin' atau identitas PBF Anda sudah terdaftar
        const identity = await wallet.get('pbfAdmin'); 
        if (!identity) {
            throw new Error('Identitas "pbfAdmin" tidak ditemukan di dalam wallet. Jalankan enrollAdminPbf.js terlebih dahulu.');
        }

        // Pastikan ini adalah file koneksi JSON untuk Org 2 (PBF)
        const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json'); 
        const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'pbfAdmin', // Gunakan identitas PBF
            discovery: { enabled: true, asLocalhost: true }
        });

        return gateway;
    } catch (error) {
        console.error(`Failed to connect to gateway: ${error}`);
        throw error;
    }
}

const riwayatController = {
    getRiwayatPengiriman: async (req, res) => {
        const { pesananId } = req.params;
        let gateway;
        try {
            // 1. Dapatkan id_aset_blockchain DARI KUERI YANG BENAR (menggunakan tabel 'users')
            const [rows] = await db.query(
              `SELECT 
                 dp.id_aset_blockchain, 
                 p.nomor_po, 
                 sjp.nomor_resi, 
                 sjp.nomor_surat_jalan, 
                 produsen.nama_resmi as nama_produsen, 
                 pbf.nama_resmi as nama_pbf
               FROM detail_pesanan dp 
               JOIN pesanan p ON dp.id_pesanan = p.id
               JOIN surat_jalan_produsen sjp ON p.id = sjp.id_pesanan
               JOIN users produsen ON p.id_produsen = produsen.id
               JOIN users pbf ON p.id_pbf = pbf.id
               WHERE p.id = ? AND p.id_pbf = ? 
               LIMIT 1`,
              [pesananId, req.user.id] // Validasi bahwa PBF ini yang memesan
            );

            if (rows.length === 0) {
                 return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan atau Anda tidak memiliki akses.' });
            }
            if (!rows[0].id_aset_blockchain) {
                return res.status(404).json({ success: false, message: 'Aset blockchain untuk pesanan ini belum dibuat (mungkin belum dikirim).' });
            }
            
            const assetId = rows[0].id_aset_blockchain;
            const pesananInfo = {
                noResi: rows[0].nomor_resi,
                suratJalan: rows[0].nomor_surat_jalan,
                pengirim: rows[0].nama_produsen,
                tujuan: rows[0].nama_pbf,
                idPesanan: pesananId,
                nomorPo: rows[0].nomor_po,
            };

            // 2. Koneksi ke Fabric
            gateway = await getGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            // Panggil kontrak 'medisync', BUKAN 'PbfContract'
            // Fungsi 'readObat' bersifat umum dan ada di kontrak utama
            const contract = network.getContract('medisync');

            // 3. Panggil 'readObat' (BUKAN 'queryHistory')
            const resultBytes = await contract.evaluateTransaction('readObat', assetId);
            
            // 4. Format hasil (hasilnya adalah 1 OBJEK, BUKAN array)
            if (!resultBytes || resultBytes.length === 0) {
                throw new Error(`Aset ${assetId} tidak ditemukan di blockchain.`);
            }
            
            const asset = JSON.parse(resultBytes.toString());
            const onChainHistory = asset.riwayat || []; // Ambil array 'riwayat' dari dalam aset

            const riwayat = onChainHistory.map(tx => {
                return {
                    // Gunakan 'status' dari dalam array riwayat
                    status: formatStatus(tx.status), 
                    detail: tx.detail || '',
                    timestamp: tx.timestamp, // Timestamp sudah ada di 'riwayat'
                };
            });
            
            // Ambil data dari riwayat untuk Waktu Pesan dan Estimasi
            const waktuKirim = riwayat.find(r => r.status === 'Dikirim')?.timestamp;
            pesananInfo.waktuPesan = waktuKirim ? new Date(waktuKirim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
            
            const estimasiSampai = waktuKirim ? new Date(waktuKirim) : new Date();
            estimasiSampai.setDate(estimasiSampai.getDate() + 2); // Estimasi 2 hari dari pengiriman
            pesananInfo.estimasiSampai = estimasiSampai.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

            res.json({ success: true, data: { ...pesananInfo, riwayat } });

        } catch (error) {
            console.error('Error getting shipment history:', error);
            res.status(500).json({ success: false, message: `Gagal mengambil riwayat: ${error.message}` });
        } finally {
            if (gateway) {
                gateway.disconnect();
            }
        }
    }
};

// Sesuaikan status ini dengan STATUS di dalam array 'riwayat' chaincode Anda
function formatStatus(status) {
    switch (status) {
        case 'DIPRODUKSI':
            return 'Dipesan';
        case 'DIKIRIM_KE_PBF':
            return 'Dikirim';
        case 'DITERIMA_PBF':
            return 'Diterima PBF';
        case 'DIKIRIM_KE_APOTEK':
            return 'Dikirim ke Apotek';
        case 'DITERIMA_APOTEK':
            return 'Diterima Apotek';
        default:
            return status;
    }
}

module.exports = riwayatController;