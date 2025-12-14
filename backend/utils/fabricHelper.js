/* file: utils/fabricHelper.js */
'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

async function registerAndEnrollUser(username, roleApp) {
    try {
        let ccpPath;
        let adminName;
        let mspId;
        let fabricRoleAttr;
        let affiliation;

        const baseDir = path.resolve(__dirname, '..'); 

        // --- 1. Konfigurasi per Role ---
        if (roleApp === 'pbf') {
            ccpPath = path.join(baseDir, 'connection-org2.json');
            adminName = 'pbfAdmin'; 
            mspId = 'PBFMSP';
            fabricRoleAttr = 'admin_pbf';
            affiliation = 'org2.department1'; 

        } else if (roleApp === 'apotek') {
            ccpPath = path.join(baseDir, 'connection-org3.json');
            adminName = 'apotekAdmin';
            mspId = 'ApotekMSP';
            fabricRoleAttr = 'admin_apotek'; 
            affiliation = 'org3.department1';

        } else {
            // Default (Produsen/Org1)
            ccpPath = path.join(baseDir, 'connection-org1.json');
            adminName = 'admin'; 
            // --- PERBAIKAN DI SINI ---
            mspId = 'ProdusenMSP'; // <--- SEBELUMNYA 'Org1MSP', HARUS 'ProdusenMSP'
            // -------------------------
            fabricRoleAttr = roleApp;
            affiliation = 'org1.department1';
        }

        console.log(`[FabricHelper] Loading profile: ${ccpPath}`);

        if (!fs.existsSync(ccpPath)) {
            throw new Error(`File Connection Profile tidak ditemukan di: ${ccpPath}`);
        }

        const walletPath = path.join(process.cwd(), 'wallet');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        // --- 2. Deteksi Nama CA ---
        if (!ccp.certificateAuthorities) {
            throw new Error(`Format Connection Profile salah: Key 'certificateAuthorities' tidak ditemukan.`);
        }

        const caKeys = Object.keys(ccp.certificateAuthorities);
        if (caKeys.length === 0) throw new Error(`Tidak ada CA terdaftar di JSON.`);
        
        const caKey = caKeys[0]; 
        const caInfo = ccp.certificateAuthorities[caKey];
        const caURL = caInfo.url;
        const caName = caInfo.caName || caKey; 

        console.log(`[FabricHelper] Target CA: ${caName} (${caURL})`);
        console.log(`[FabricHelper] Target MSP: ${mspId}`); // Debugging MSP
        
        const ca = new FabricCAServices(caURL, { verify: false, trustedRoots: [] }, caName);
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // --- 3. Cek User Existing ---
        const userIdentity = await wallet.get(username);
        if (userIdentity) {
            console.log(`Identity "${username}" sudah ada di wallet.`);
            return;
        }

        // --- 4. Cek Admin Existing ---
        const adminIdentity = await wallet.get(adminName);
        if (!adminIdentity) {
            throw new Error(`Admin "${adminName}" tidak ditemukan di wallet. Jalankan script enrollAdmin terlebih dahulu.`);
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminName);

        // --- 5. Register User ---
        console.log(`[FabricHelper] Registering user '${username}' (Affiliation: ${affiliation})...`);

        const secret = await ca.register({
            affiliation: affiliation,
            enrollmentID: username,
            role: 'client',
            attrs: [
                { name: 'role', value: fabricRoleAttr, ecert: true } 
            ]
        }, adminUser);

        // --- 6. Enroll User ---
        console.log(`[FabricHelper] Enrolling user '${username}'...`);
        const enrollment = await ca.enroll({
            enrollmentID: username,
            enrollmentSecret: secret
        });

        // --- 7. Simpan ke Wallet ---
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspId, // <-- Ini yang akan diperbaiki (ProdusenMSP)
            type: 'X.509',
        };
        await wallet.put(username, x509Identity);
        console.log(`[FabricHelper] SUKSES: User "${username}" berhasil didaftarkan ke Blockchain (MSP: ${mspId}).`);
        
    } catch (error) {
        console.error(`[FabricHelper Error]: ${error.message}`);
        throw new Error(`Fabric Registration Failed: ${error.message}`);
    }
}

module.exports = { registerAndEnrollUser };