'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // Buat wallet baru untuk menyimpan identitas
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Lokasi wallet: ${walletPath}`);

        // Cek apakah admin sudah ada di wallet
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('Identitas untuk admin "admin" sudah ada di dalam wallet.');
            return;
        }

        // --- PERBAIKAN DI BAWAH INI ---
        // Dapatkan path ke material kripto admin Org1
        const adminCertPath = path.resolve(__dirname, '../organizations/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp/signcerts/cert.pem');
        const adminKeyDirPath = path.resolve(__dirname, '../organizations/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp/keystore/');
        
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
            mspId: 'ProdusenMSP',
            type: 'X.509',
        };

        // Masukkan identitas admin baru ke dalam wallet
        await wallet.put('admin', x509Identity);
        console.log('Berhasil mendaftarkan user admin "admin" dan menyimpannya ke dalam wallet');

    } catch (error) {
        console.error(`Gagal mendaftarkan user admin "admin": ${error}`);
        process.exit(1);
    }
}

main();