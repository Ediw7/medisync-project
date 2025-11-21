// File: backend/baseline_test.js

const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // 1. Setup Gateway menggunakan identitas PRODUSEN
        // (Pastikan file-file ini ada di folder backend/)
        const ccp = JSON.parse(fs.readFileSync('connection-org1.json', 'utf8'));
        const wallet = await Wallets.newFileSystemWallet('./wallet');
        const gateway = new Gateway();

        // --- Identitas SAH (Produsen) ---
        await gateway.connect(ccp, { 
            wallet, 
            identity: 'produsenAdmin', // Menggunakan identitas Produsen
            discovery: { enabled: true, asLocalhost: true } 
        });

        const network = await gateway.getNetwork('medisyncchannel');
        const contract = network.getContract('medisync', 'ProdusenContract');

        // 2. Menjalankan transaksi yang SAH
        console.log('--> Menjalankan Transaksi (Baseline): createObat...');
        const result = await contract.submitTransaction(
            'createObat',
            'P1-BASELINE-TEST-001', 'Obat Uji Baseline', 'GKL123', 
            'Paracetamol', '500mg', '2025-01-01', '2027-01-01', 
            'Tablet', 'Admin Uji', '1000', '1500', 
            'hash_uji_mutu_dummy', 'PT Produsen Apotek', '1'
        );

        console.log(`*** Hasil Transaksi Baseline (Sukses): ${Buffer.from(result).toString()}`);

        await gateway.disconnect();
    } catch (error) {
        console.error(`*** Transaksi Baseline GAGAL: ${error}`);
    }
}
main();