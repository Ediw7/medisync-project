'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Buat wallet baru untuk menyimpan identitas PBF
        const walletPath = path.join(process.cwd(), 'wallet', 'pbf-user');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Lokasi wallet: ${walletPath}`);

        // Cek apakah admin sudah ada di wallet
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('Identitas untuk admin "admin" sudah ada di dalam wallet.');
            return;
        }

        // Dapatkan path ke material kripto admin Org2
        const adminCertPath = path.resolve(__dirname, 'organizations/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp/signcerts/Admin@org2.medisync.com-cert.pem');
        const adminKeyDirPath = path.resolve(__dirname, 'organizations/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp/keystore/');
        
        // Pastikan file sertifikat ada
        if (!fs.existsSync(adminCertPath)) {
            console.error(`File sertifikat admin tidak ditemukan di: ${adminCertPath}`);
            process.exit(1);
        }

        // Temukan file kunci privat secara dinamis di dalam folder keystore
        const keyFiles = fs.readdirSync(adminKeyDirPath);
        if (keyFiles.length === 0) {
            console.error(`Tidak ada file kunci privat yang ditemukan di: ${adminKeyDirPath}`);
            process.exit(1);
        }
        const adminKeyPath = path.resolve(adminKeyDirPath, keyFiles[0]);

        const certificate = fs.readFileSync(adminCertPath).toString();
        const privateKey = fs.readFileSync(adminKeyPath).toString();

        // Buat identitas X.509 baru
        const x509Identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: 'PBFMSP',
            type: 'X.509',
        };

        // Masukkan identitas admin baru ke dalam wallet
        await wallet.put('admin', x509Identity);
        console.log('Berhasil mendaftarkan user admin "admin" untuk PBFMSP dan menyimpannya ke dalam wallet');

        // Salin kredensial ke struktur yang diharapkan oleh penerimaanController.js
        const signcertsPath = path.join(walletPath, 'signcerts');
        const keystorePath = path.join(walletPath, 'keystore');
        fs.mkdirSync(signcertsPath, { recursive: true });
        fs.mkdirSync(keystorePath, { recursive: true });
        fs.writeFileSync(path.join(signcertsPath, 'cert.pem'), certificate);
        fs.writeFileSync(path.join(keystorePath, 'key.pem'), privateKey);
        console.log(`Kredensial disalin ke: ${signcertsPath}/cert.pem dan ${keystorePath}/key.pem`);

    } catch (error) {
        console.error(`Gagal mendaftarkan user admin untuk PBFMSP: ${error}`);
        process.exit(1);
    }
}

main();