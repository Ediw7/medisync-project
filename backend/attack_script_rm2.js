// File: backend/attack_script_rm2.js
'use strict';

const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// --- KONFIGURASI ---
const PBF_IDENTITY = 'pbfAdmin';

// !!! GANTI DENGAN ID ASET VALID YANG MASIH DIMILIKI PBF !!!
// (Gunakan ID dari CouchDB yang Anda kirim: P1-20251112-57ABA78F-000300)
const ASET_ID_SIAP_DIKIRIM = 'P1-20251112-57ABA78F-000300'; 
const JUMLAH_KIRIM = '100'; // Pastikan stok cukup
const PESANAN_ID = 'RM2-ATTACK-003'; // ID Pesanan Apotek (dummy, buat unik)
// --------------------

async function main() {
    const gateway = new Gateway();
    try {
        // 1. KONEKSI SEBAGAI PBF (Attacker)
        console.log(`--> [Serangan] Menghubungkan sebagai PBF (${PBF_IDENTITY})...`);
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

        // 2. MEMBUAT TRANSAKSI
        console.log('--> [Serangan] Membuat Proposal Transaksi...');
        const transaction = contract.createTransaction('transferToApotek');

        // --- !!! INI ADALAH SERANGANNYA !!! ---
        // Kita HANYA meminta endorsement dari Org PBF,
        // melanggar policy AND('PBFMSP', 'ApotekMSP')
        console.log('--> [Serangan] Mengatur Endorsement HANYA untuk PBFMSP...');
        transaction.setEndorsingOrganizations('PBFMSP');
        // --- KITA SENGAJA TIDAK MENAMBAHKAN 'ApotekMSP' ---

        console.log('--> [Serangan] Menjalankan submitTransaction...');
        
        // 3. MENJALANKAN ALUR (INI AKAN GAGAL SAAT VALIDASI)
        const result = await transaction.submit(
            PESANAN_ID, // idPesanan
            `HASH-DUMMY-${PESANAN_ID}`, // hashSuratJalan
            'Apotek Tes Serangan', // namaApotek
            JSON.stringify([ASET_ID_SIAP_DIKIRIM]), // obatIdsJson
            JSON.stringify([{ obatId: ASET_ID_SIAP_DIKIRIM, jumlah: JUMLAH_KIRIM }]) // jumlahPesananJson
        );

        // 4. Jika kode sampai di sini, tes GAGAL (Serangan Berhasil)
        console.error(`\n*** !!! TES SERANGAN GAGAL (SISTEM JEBOL) !!! ***`);
        console.error(`*** Transaksi berhasil di-commit (Hasil: ${result.toString()}), padahal seharusnya ditolak.`);

    } catch (error) {
        // 5. Jika kode masuk ke sini, tes BERHASIL (Serangan Digagalkan)
        // Kita cari error yang spesifik
        if (error.message.includes('ENDORSEMENT_POLICY_FAILURE') || 
            error.message.includes('failed to satisfy policy') || 
            error.message.includes('No valid responses from any peers')) 
        {
            console.error(`\n*** ✅ TES SERANGAN BERHASIL (SERANGAN DIGAGALKAN) ***`);
            console.error(`\nTransaksi ditolak oleh SDK/Peer:`);
            console.error("====================================================================");
            console.error(error.message); // Menampilkan error lengkap
            console.error("====================================================================");
        } else {
            console.error(`\n*** TES GAGAL dengan error tak terduga ***`);
            console.error(error);
        }
    } finally {
        if (gateway) {
            gateway.disconnect();
        }
    }
}

main();