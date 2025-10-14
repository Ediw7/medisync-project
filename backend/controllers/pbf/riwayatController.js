'use strict';

const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs').promises;
const db = require('../../config/db');

// Reusable function to connect to the gateway
async function getGateway() {
    try {
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get('pbfAdmin');
        if (!identity) {
            throw new Error('Identitas "pbfAdmin" tidak ditemukan di dalam wallet. Jalankan enrollAdminPbf.js terlebih dahulu.');
        }

        const ccpPath = path.resolve(__dirname, '..', '..', 'connection-org2.json');
        const ccp = JSON.parse(await fs.readFile(ccpPath, 'utf8'));

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'pbfAdmin',
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
        const { pesananId } = req.params; // Menggunakan pesananId dari URL
        let gateway;
        try {
            // 1. Dapatkan id_aset_blockchain dari database berdasarkan pesananId
            const [rows] = await db.query(
              'SELECT dp.id_aset_blockchain, p.no_resi, p.surat_jalan, pr.nama as nama_produsen, pbf.nama as nama_pbf FROM detail_pesanan dp JOIN pesanan p ON dp.id_pesanan = p.id JOIN produsen pr ON p.id_produsen = pr.id JOIN pbf ON p.id_pbf = pbf.id WHERE p.id = ? LIMIT 1',
              [pesananId]
            );

            if (rows.length === 0 || !rows[0].id_aset_blockchain) {
                return res.status(404).json({ success: false, message: 'Aset blockchain untuk pesanan ini tidak ditemukan.' });
            }
            const assetId = rows[0].id_aset_blockchain;
            const pesananInfo = {
                noResi: rows[0].no_resi,
                suratJalan: rows[0].surat_jalan,
                pengirim: rows[0].nama_produsen,
                tujuan: rows[0].nama_pbf,
                idPesanan: pesananId,
            };


            // 2. Koneksi ke Fabric
            gateway = await getGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync', 'PbfContract');

            // 3. Panggil chaincode untuk mendapatkan riwayat aset
            const resultBytes = await contract.evaluateTransaction('queryHistory', assetId);
            const resultJson = JSON.parse(resultBytes.toString());

            // 4. Format hasil untuk frontend
            const riwayat = resultJson.map(tx => {
                const status = tx.Value.statusSaatIni;
                // Ambil timestamp dari 'riwayat' terakhir jika ada, jika tidak, dari timestamp transaksi
                const latestHistory = tx.Value.riwayat && tx.Value.riwayat.length > 0 ? tx.Value.riwayat[tx.Value.riwayat.length - 1] : null;
                const timestamp = latestHistory ? latestHistory.timestamp : tx.Timestamp;

                return {
                    status: formatStatus(status),
                    tanggal: new Date(timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
                    waktu: new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                };
            }).filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.status === item.status
                ))
            ); // Hapus duplikat status

             // Menambahkan estimasi sampai (jika diperlukan)
            const waktuPesan = resultJson.length > 0 ? new Date(resultJson[0].Timestamp) : new Date();
            const estimasiSampai = new Date(waktuPesan);
            estimasiSampai.setDate(waktuPesan.getDate() + 2); // Contoh estimasi 2 hari
            pesananInfo.waktuPesan = waktuPesan.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
            pesananInfo.estimasiSampai = estimasiSampai.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');


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

function formatStatus(status) {
    switch (status) {
        case 'DIBUAT':
            return 'Dipesan';
        case 'DIKIRIM_KE_PBF':
            return 'Dikirim';
        case 'DITERIMA_PBF':
            return 'Selesai';
        default:
            return status;
    }
}

module.exports = riwayatController;
