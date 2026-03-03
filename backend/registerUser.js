'use strict';

/**
 * registerUser.js — Mendaftarkan identitas user ke dalam wallet Fabric
 * 
 * Script ini membaca sertifikat dari materi kripto yang sudah di-generate
 * oleh network.sh (via Fabric CA) dan menyimpannya ke wallet filesystem
 * dengan LABEL sesuai username MySQL.
 * 
 * Cara Pakai:
 *   node registerUser.js <walletLabel> <orgNumber>
 * 
 * Contoh:
 *   node registerUser.js produsen 1     → Simpan identitas Org1 Admin sebagai 'produsen' di wallet
 *   node registerUser.js admin_pbf 2    → Simpan identitas Org2 Admin sebagai 'admin_pbf' di wallet
 *   node registerUser.js admin_apotek 3 → Simpan identitas Org3 Admin sebagai 'admin_apotek' di wallet
 * 
 * Penting: walletLabel harus SAMA PERSIS dengan field 'username' di tabel MySQL 'users',
 *          karena getGateway(req.user.username) menggunakan nilai ini untuk mencari di wallet.
 */

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// Mapping org number ke MSP ID
const ORG_CONFIG = {
    '1': { mspId: 'ProdusenMSP', orgName: 'org1.medisync.com' },
    '2': { mspId: 'PBFMSP',      orgName: 'org2.medisync.com' },
    '3': { mspId: 'ApotekMSP',   orgName: 'org3.medisync.com' },
};

async function main() {
    const walletLabel = process.argv[2];
    const orgNumber = process.argv[3];

    if (!walletLabel || !orgNumber) {
        console.error('=========================================');
        console.error('Penggunaan: node registerUser.js <walletLabel> <orgNumber>');
        console.error('');
        console.error('Contoh:');
        console.error('  node registerUser.js produsen 1');
        console.error('  node registerUser.js admin_pbf 2');
        console.error('  node registerUser.js admin_apotek 3');
        console.error('');
        console.error('walletLabel = username di MySQL (mis: "produsen")');
        console.error('orgNumber   = 1 (Produsen), 2 (PBF), 3 (Apotek)');
        console.error('=========================================');
        process.exit(1);
    }

    const config = ORG_CONFIG[orgNumber];
    if (!config) {
        console.error(`ERROR: orgNumber '${orgNumber}' tidak valid. Gunakan 1, 2, atau 3.`);
        process.exit(1);
    }

    try {
        // 1. Buka wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Lokasi wallet: ${walletPath}`);

        // 2. Cek apakah identitas sudah ada
        const existingIdentity = await wallet.get(walletLabel);
        if (existingIdentity) {
            console.log(`Identitas '${walletLabel}' sudah ada di wallet. Menimpa dengan yang baru...`);
        }

        // 3. Baca sertifikat dan kunci privat dari materi kripto
        const certPath = path.resolve(
            __dirname, '..', 'organizations', 'peerOrganizations',
            config.orgName, 'users', `Admin@${config.orgName}`, 'msp', 'signcerts', 'cert.pem'
        );
        const keyDirPath = path.resolve(
            __dirname, '..', 'organizations', 'peerOrganizations',
            config.orgName, 'users', `Admin@${config.orgName}`, 'msp', 'keystore'
        );

        if (!fs.existsSync(certPath)) {
            console.error(`ERROR: Sertifikat tidak ditemukan di: ${certPath}`);
            console.error('Pastikan network.sh sudah dijalankan (generateCryptoCA).');
            process.exit(1);
        }

        const keyFiles = fs.readdirSync(keyDirPath).filter(f => f.endsWith('_sk') || !f.startsWith('.'));
        if (keyFiles.length === 0) {
            console.error(`ERROR: Kunci privat tidak ditemukan di: ${keyDirPath}`);
            process.exit(1);
        }
        const keyPath = path.resolve(keyDirPath, keyFiles[0]);

        const certificate = fs.readFileSync(certPath).toString();
        const privateKey = fs.readFileSync(keyPath).toString();

        // 4. Buat identitas X.509 dan simpan ke wallet
        const x509Identity = {
            credentials: {
                certificate: certificate,
                privateKey: privateKey,
            },
            mspId: config.mspId,
            type: 'X.509',
        };

        await wallet.put(walletLabel, x509Identity);
        console.log('=========================================');
        console.log(`BERHASIL: Identitas '${walletLabel}' (${config.mspId}) disimpan ke wallet.`);
        console.log(`Atribut ABAC dalam sertifikat akan secara otomatis tersedia`);
        console.log(`saat getGateway('${walletLabel}') dipanggil oleh backend.`);
        console.log('=========================================');

    } catch (error) {
        console.error(`GAGAL mendaftarkan '${walletLabel}': ${error}`);
        process.exit(1);
    }
}

main();
