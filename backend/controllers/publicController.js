'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

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
            // Kirim pesan error yang lebih ramah pengguna
            const errorMessage = error.toString().includes("tidak ditemukan") 
                ? `Obat dengan Batch ID ${batchId} tidak ditemukan di blockchain.`
                : "Terjadi kesalahan saat mengambil data dari blockchain.";
            res.status(404).json({ success: false, message: errorMessage });
        } finally {
            if (gateway) gateway.disconnect();
        }
    }
};

module.exports = publicController;
