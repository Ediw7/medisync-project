// File: backend/baseline_rm2.js
'use strict';

const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI (GANTI INI) ---
const PBF_IDENTITY = 'pbfAdmin';

// !!! GANTI DENGAN ID ASET DARI COUCHDB PBF ANDA (dari Langkah 1.4) !!!
const ASET_ID_SIAP_DIKIRIM = 'P1-20251112-57ABA78F-000299'; 
const JUMLAH_KIRIM = '100'; // Jumlah yang akan dikirim (pastikan stok cukup)
const PESANAN_ID = 'RM2-BASELINE-002'; // ID Pesanan Apotek (buat ID unik baru)
// --------------------------------

async function main() {
    const gateway = new Gateway();
    try {
        // 1. KONEKSI SEBAGAI PBF (Inisiator)
        console.log(`--> [Baseline] Menghubungkan sebagai PBF (${PBF_IDENTITY})...`);
        const ccpPathPbf = path.resolve(__dirname, 'connection-org2.json');
        const ccpPbf = JSON.parse(fs.readFileSync(ccpPathPbf, 'utf8'));
        const wallet = await Wallets.newFileSystemWallet('./wallet');
        
        await gateway.connect(ccpPbf, {
            wallet,
            identity: PBF_IDENTITY,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('medisyncchannel');
        const contract = network.getContract('medisync', 'PbfContract');

        // 2. MEMBUAT TRANSAKSI DAN MENETAPKAN PEERS (Endorsement Policy)
        console.log('--> [Baseline] Membuat Proposal Transaksi...');
        const transaction = contract.createTransaction('transferToApotek');

        // PENTING: Sesuai policy AND('PBFMSP.member', 'ApotekMSP.member')
        // Ini memberitahu SDK untuk mengirim proposal ke peer dari Org2 (PBF) DAN Org3 (Apotek)
        transaction.setEndorsingOrganizations('PBFMSP', 'ApotekMSP');

        console.log('--> [Baseline] Menjalankan submitTransaction (Endorse, Order, Commit)...');
        
        // 3. MENJALANKAN ALUR LENGKAP
        const result = await transaction.submit(
            PESANAN_ID, // idPesanan
            `HASH-DUMMY-${PESANAN_ID}`, // hashSuratJalan
            'Apotek Tes Baseline', // namaApotek
            JSON.stringify([ASET_ID_SIAP_DIKIRIM]), // obatIdsJson
            JSON.stringify([{ obatId: ASET_ID_SIAP_DIKIRIM, jumlah: JUMLAH_KIRIM }]) // jumlahPesananJson
        );

        console.log(`\n*** ✅ TES BASELINE BERHASIL ***`);
        console.log(`*** Transaksi berhasil di-commit.`);
        console.log(`*** Aset baru yang dibuat (untuk Apotek): ${JSON.parse(result.toString()).createdAssetIds.join(', ')}`);

    } catch (error) {
        console.error(`\n*** !!! TES BASELINE GAGAL !!! ***`);
        console.error(error.message);
    } finally {
        gateway.disconnect();
    }
}

main();