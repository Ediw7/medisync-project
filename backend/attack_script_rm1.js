// File: backend/attack_script_rm1.js
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    let gateway;
    try {
        // 1. Setup Gateway menggunakan identitas PBF
        const ccpPath = path.resolve(__dirname, 'connection-org2.json'); // Menggunakan koneksi Org2 (PBF)
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        gateway = new Gateway();
        
        // --- Identitas CURIAN (PBF) ---
        await gateway.connect(ccp, { 
            wallet, 
            identity: 'pbfAdmin', // Menggunakan identitas PBF
            discovery: { enabled: true, asLocalhost: true } 
        });

        const network = await gateway.getNetwork('medisyncchannel');
        // Target kontrak tetap 'ProdusenContract'
        const contract = network.getContract('medisync', 'ProdusenContract');

        // 2. Mencoba menjalankan transaksi ILEGAL
        console.log('--> Menjalankan Transaksi Serangan: createObat (sebagai PBF)...');
        await contract.submitTransaction(
            'createObat',
            'P1-ATTACK-TEST-002', 'Obat Ilegal', 'GKL999', 
            'Falsified', '1000mg', '2025-01-01', '2027-01-01', 
            'Kapsul', 'Attacker', '500', '100', 
            'hash_palsu', 'PT Attacker', '99'
        );
        
        // 3. Jika kode mencapai titik ini, tes GAGAL
        console.error(`\n*** !!! TES SERANGAN GAGAL !!! ***`);
        console.error(`*** Transaksi seharusnya ditolak, tetapi BERHASIL. ***`);
        
    } catch (error) {
        // 4. Jika kode mencapai titik ini, tes BERHASIL
        console.error(`\n*** ✅ TES SERANGAN BERHASIL (SERANGAN DIGAGALKAN) ***`);
        console.error(`\nTransaksi ditolak dengan pesan error:`);
        
        // Menampilkan pesan error yang bersih dari Fabric
        if (error.message.includes('ERROR: Organisasi PBFMSP')) {
            console.error("====================================================================");
            console.error(error.message.split('\n').find(line => line.includes('ERROR:')));
            console.error("====================================================================");
        } else {
             console.error(error.message);
        }
        
    } finally {
        if (gateway) {
            gateway.disconnect();
        }
    }
}
main();