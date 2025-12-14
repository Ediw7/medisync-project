/* File: enrollAdminPBF.js */
'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function main() {
    try {
        // 1. Setup Konfigurasi
        const ccpPath = path.resolve(__dirname, 'connection-org2.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const walletPath = path.join(process.cwd(), 'wallet');
        
        // 2. Ambil Info CA dari Connection Profile
        // Kita ambil CA pertama yang ada di list (ca.org2.medisync.com)
        const caInfo = ccp.certificateAuthorities['ca.org2.medisync.com'];
        if (!caInfo) {
            throw new Error('CA "ca.org2.medisync.com" tidak ditemukan di connection-org2.json');
        }

        const caURL = caInfo.url;
        const caName = caInfo.caName;
        
        // 3. Setup TLS (Penting untuk koneksi aman)
        // Path sertifikat TLS harus di-resolve relatif terhadap lokasi file connection.json atau absolute path
        // Di connection profile Anda tertulis: "../organizations/..."
        // Kita asumsikan struktur folder standar
        const tlsCertPath = path.resolve(__dirname, caInfo.tlsCACerts.path);
        
        if (!fs.existsSync(tlsCertPath)) {
             console.warn(`PERINGATAN: File TLS CA tidak ditemukan di ${tlsCertPath}. Mencoba koneksi tanpa verifikasi TLS root (insecure mode).`);
        }
        
        // Buat Client CA
        const ca = new FabricCAServices(caURL, { 
            trustedRoots: fs.existsSync(tlsCertPath) ? fs.readFileSync(tlsCertPath) : [], 
            verify: false 
        }, caName);

        // 4. Setup Wallet
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Cek jika sudah ada (Nanti akan kita timpa/overwrite)
        const identity = await wallet.get('pbfAdmin');
        if (identity) {
            console.log('Identitas "pbfAdmin" sudah ada. Akan dilakukan enroll ulang (overwrite) dengan hak akses Registrar...');
        }

        // 5. ENROLL ADMIN CA
        // Default credentials untuk Hyperledger Fabric Test Network adalah admin / adminpw
        // Jika Anda mengubah docker-compose, sesuaikan ini.
        console.log('Menghubungi CA untuk enroll admin...');
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
            mspId: 'PBFMSP', // MSP ID Org2
            type: 'X.509',
        };

        await wallet.put('pbfAdmin', x509Identity);
        console.log('SUKSES: Admin "pbfAdmin" berhasil di-enroll dengan hak akses Registrar dan disimpan ke wallet.');

    } catch (error) {
        console.error(`Gagal enroll admin: ${error}`);
        console.error('Tips: Pastikan container CA Org2 berjalan dan port 8054 terbuka.');
        process.exit(1);
    }
}

main();