/* File: enrollAdmin.js */
'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function main() {
    try {
        // 1. Setup Konfigurasi Org1
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        
        if (!fs.existsSync(ccpPath)) {
            throw new Error(`File koneksi tidak ditemukan di: ${ccpPath}`);
        }

        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const walletPath = path.join(process.cwd(), 'wallet');
        
        // 2. Ambil Info CA (Auto-detect)
        if (!ccp.certificateAuthorities) {
            throw new Error('Key "certificateAuthorities" tidak ditemukan di connection-org1.json.');
        }

        // Ambil key pertama (ca.org1.medisync.com)
        const caKeys = Object.keys(ccp.certificateAuthorities);
        const caKey = caKeys[0]; 
        const caInfo = ccp.certificateAuthorities[caKey];
        const caURL = caInfo.url;
        
        // Ambil nama internal CA (ca-org1)
        const caName = caInfo.caName || caKey;

        console.log(`Target CA: ${caName} (${caURL})`);

        // 3. Setup CA Client (Insecure untuk local dev)
        const ca = new FabricCAServices(caURL, { verify: false, trustedRoots: [] }, caName);

        // 4. Setup Wallet
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        const identity = await wallet.get('admin'); 
        if (identity) {
            console.log('Identitas "admin" (Org1) sudah ada. Melakukan enroll ulang...');
        }

        // 5. ENROLL ADMIN
        // Default credentials Hyperledger Test Network: admin / adminpw
        console.log('Menghubungi CA Org1 untuk enroll admin...');
        const enrollment = await ca.enroll({ 
            enrollmentID: 'admin', 
            enrollmentSecret: 'adminpw' 
        });

        // 6. Simpan ke Wallet
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'ProdusenMSP', // MSP Org1
            type: 'X.509',
        };

        await wallet.put('admin', x509Identity);
        console.log('SUKSES: Admin Org1 ("admin") berhasil di-enroll dan disimpan ke wallet.');

    } catch (error) {
        console.error(`Gagal enroll admin Org1: ${error}`);
        process.exit(1);
    }
}

main();