/* File: seedDataProdusen.js */
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function main() {
    try {
        // --- KONFIGURASI ---
        const username = 'produsen_user_2'; // User Produsen yang sudah diregister sebelumnya
        const channelName = 'medisyncchannel';
        const chaincodeName = 'medisync';
        const contractInfo = 'ProdusenContract'; // Nama Class di Chaincode

        // Load Connection Profile Org1 (Produsen)
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        if (!fs.existsSync(ccpPath)) {
            throw new Error(`File koneksi tidak ditemukan di: ${ccpPath}`);
        }
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Load Wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(username);
        if (!identity) {
            throw new Error(`Identitas "${username}" tidak ditemukan di wallet. Jalankan register user produsen dulu.`);
        }

        // Connect Gateway
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: username,
            discovery: { enabled: true, asLocalhost: true }
        });

        console.log('Terhubung ke Gateway Produsen...');
        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);

        // --- DATA DUMMY (SESUAI SQL & POSTMAN ANDA) ---
        const idBatch = 'BATCH-XYZ-123';  // Sesuai id_aset_blockchain di SQL
        const idPesanan = '272';          // Sesuai ID Pesanan di SQL
        const idPbf = '19';               // Sesuai ID User PBF Anda
        const namaPbf = 'PT PBF Testing'; // Sesuai nama di SQL
        const idProdusen = '1';           // Sesuai id_produsen di SQL

        // 1. TRANSAKSI: createObat
        console.log(`\n[1/2] Membuat aset obat: ${idBatch}...`);
        
        // Argumen sesuai urutan di ProdusenContract.js:
        // createObat(ctx, id, namaObat, nomorIzinEdar, komposisi, dosis, tanggalProduksi, tanggalKadaluarsa, bentukSediaan, penanggungJawab, jumlah, hargaPerUnit, hashHasilUjiMutu, namaPerusahaan, idProdusen)
        try {
            await contract.submitTransaction(
                `${contractInfo}:createObat`,
                idBatch,              // id
                'Amoxicillin Test',   // namaObat
                'NIE-TEST-123',       // nomorIzinEdar
                'Amoxicillin 500mg',  // komposisi
                '500 mg',             // dosis
                new Date().toISOString(), // tanggalProduksi
                new Date(Date.now() + 31536000000).toISOString(), // tanggalKadaluarsa (+1 tahun)
                'Tablet',             // bentukSediaan
                'Apt. Produsen',      // penanggungJawab
                '1000',               // jumlah (Stok awal)
                '100000',             // hargaPerUnit
                'hash-uji-mutu-dummy',// hashHasilUjiMutu
                'PT Bio Farma',       // namaPerusahaan
                idProdusen            // idProdusen
            );
            console.log('✅ Sukses: Aset obat berhasil dibuat.');
        } catch (error) {
            if (error.message.includes('sudah ada')) {
                console.log('⚠️ Aset sudah ada, melanjutkan ke transfer...');
            } else {
                throw error;
            }
        }

        // 2. TRANSAKSI: transferToPbf
        console.log(`\n[2/2] Mengirim obat ke PBF (Pesanan ID: ${idPesanan})...`);

        // Argumen sesuai urutan:
        // transferToPbf(ctx, idPesanan, hashSuratJalan, namaPbf, idPbf, obatIdsJson, jumlahPesananJson)
        
        const obatIdsJson = JSON.stringify([idBatch]);
        const jumlahPesananJson = JSON.stringify([
            { obatId: idBatch, jumlah: 50 } // Mengirim 50 item
        ]);

        await contract.submitTransaction(
            `${contractInfo}:transferToPbf`,
            idPesanan,
            'hash-surat-jalan-dummy',
            namaPbf,
            idPbf,
            obatIdsJson,
            jumlahPesananJson
        );
        console.log('✅ Sukses: Obat berhasil ditransfer ke PBF (Status: DIKIRIM_KE_PBF).');

        console.log('\n---------------------------------------------------');
        console.log('DATA REAL SUDAH SIAP!');
        console.log('Silakan kembali ke Postman dan jalankan endpoint PBF Penerimaan.');
        console.log('---------------------------------------------------');

        gateway.disconnect();

    } catch (error) {
        console.error(`❌ Gagal: ${error}`);
        process.exit(1);
    }
}

main();