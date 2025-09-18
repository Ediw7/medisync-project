'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const db = require('../config/db'); 

// Fungsi helper untuk koneksi ke gateway (bisa dipindah ke file terpisah)
async function getGateway() {
    const walletPath = path.resolve(__dirname, '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const gateway = new Gateway();
    const connectionOptions = {
        wallet,
        identity: 'admin', // Menggunakan identitas admin untuk query publik
        discovery: { enabled: false, asLocalhost: true }
    };
    await gateway.connect(ccp, connectionOptions);
    return gateway;
}

const publicController = {
    // Fungsi untuk mengambil riwayat obat berdasarkan Batch ID
    getRiwayatObat: async (req, res) => {
        const { batchId } = req.params;
        let gateway;
        try {
            gateway = await getGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            console.log(`Public query for drug history with Batch ID: ${batchId}`);
            const result = await contract.evaluateTransaction('KonsumenContract:queryRiwayatObat', batchId);
            
            res.status(200).json({ success: true, data: JSON.parse(result.toString()) });
        } catch (error) {
            console.error(`Failed to evaluate public transaction: ${error}`);
            const errorMessage = error.toString().includes("tidak ditemukan") 
                ? `Obat dengan Batch ID ${batchId} tidak ditemukan di blockchain.`
                : "Terjadi kesalahan saat mengambil data dari blockchain.";
            res.status(404).json({ success: false, message: errorMessage });
        } finally {
            if (gateway) gateway.disconnect();
        }
    },

    // Fungsi untuk mengambil detail blockchain berdasarkan Batch ID
    getBlockchainDetail: async (req, res) => {
        const { batch_id } = req.params;
        let gateway;
        try {
            gateway = await getGateway();
            const network = await gateway.getNetwork('medisyncchannel');
            const contract = network.getContract('medisync');

            const result = await contract.evaluateTransaction('ProdusenContract:readObat', batch_id);
            const blockchainData = JSON.parse(result.toString());

            // Data dikembalikan langsung dari blockchain tanpa tambahan dari database
            const responseData = {
                batch_id: blockchainData.id,
                nama_obat: blockchainData.namaObat,
                tanggal_produksi: blockchainData.tanggalProduksi,
                tanggal_kadaluarsa: blockchainData.tanggalKadaluarsa,
                penanggung_jawab: blockchainData.penanggungJawab,
                jumlah: blockchainData.jumlah,
                hash_sertifikat: blockchainData.hashDokumen.hasilUjiMutu,
                status_saat_ini: blockchainData.statusSaatIni,
                riwayat: blockchainData.riwayat
            };

            res.json({ success: true, data: responseData });
        } catch (error) {
            console.error('Error in getBlockchainDetail:', error);
            res.status(500).json({ success: false, message: `Gagal mengambil data blockchain: ${error.message}` });
        } finally {
            if (gateway) gateway.disconnect();
        }
    }
};

module.exports = publicController;