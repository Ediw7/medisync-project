'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Menggunakan wallet yang sama
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Lokasi wallet: ${walletPath}`);

        // Cek apakah admin PBF sudah ada di wallet
        const identity = await wallet.get('pbfAdmin');
        if (identity) {
            console.log('Identitas untuk admin "pbfAdmin" sudah ada di dalam wallet.');
            return;
        }

        // Dapatkan path ke material kripto admin Org2 (PBF)
        const adminCertPath = path.resolve(__dirname, '../organizations/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp/signcerts/cert.pem');
        const adminKeyDirPath = path.resolve(__dirname, '../organizations/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp/keystore/');
        
        if (!fs.existsSync(adminCertPath)) {
            console.error(`File sertifikat admin tidak ditemukan di: ${adminCertPath}`);
            process.exit(1);
        }

        const keyFiles = fs.readdirSync(adminKeyDirPath);
        if (keyFiles.length === 0) {
            console.error(`Tidak ada file kunci privat yang ditemukan di: ${adminKeyDirPath}`);
            process.exit(1);
        }
        const adminKeyPath = path.resolve(adminKeyDirPath, keyFiles[0]);

        const certificate = fs.readFileSync(adminCertPath).toString();
        const privateKey = fs.readFileSync(adminKeyPath).toString();

        const x509Identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: 'PBFMSP', // <-- Diubah untuk PBF
            type: 'X.509',
        };

        // Masukkan identitas admin baru ke dalam wallet dengan nama 'pbfAdmin'
        await wallet.put('pbfAdmin', x509Identity);
        console.log('Berhasil mendaftarkan user admin "pbfAdmin" dan menyimpannya ke dalam wallet');

    } catch (error) {
        console.error(`Gagal mendaftarkan user admin "pbfAdmin": ${error}`);
        process.exit(1);
    }
}

main();