'use strict';

const axios = require('axios');
const mysql = require('mysql2/promise');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

// ================================================================= //
// == KONFIGURASI PENGUJIAN (Ubah sesuai kebutuhan Anda) == //
// ================================================================= //
const JUMLAH_TRANSAKSI = 10000; // Mulai dengan angka kecil (misal: 10), baru naikkan ke 1000
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwicm9sZSI6InByb2R1c2VuIiwidXNlcm5hbWUiOiJNZWRpc3luYyBQaGFybWEiLCJpYXQiOjE3NTg2OTgxOTcsImV4cCI6MTc1ODcwMTc5N30.JXrNK_rn0U1DPiKc4gusJvz0ywT_9FPYQ5u97Z3bKgo';

const API_BASE_URL = 'http://localhost:5000/api';

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '', // Ganti jika database Anda memiliki password
    database: 'medisync_db'
};

const FABRIC_CONFIG = {
    walletPath: path.resolve(__dirname, 'wallet'),
    connectionProfilePath: path.resolve(__dirname, 'connection-org1.json'),
    channelName: 'medisyncchannel',
    chaincodeName: 'medisync',
    identity: 'admin'
};
// ================================================================= //

async function getGateway() {
    const wallet = await Wallets.newFileSystemWallet(FABRIC_CONFIG.walletPath);
    const identity = await wallet.get(FABRIC_CONFIG.identity);
    if (!identity) throw new Error(`Identitas "${FABRIC_CONFIG.identity}" tidak ditemukan di wallet.`);
    const ccp = JSON.parse(fs.readFileSync(FABRIC_CONFIG.connectionProfilePath, 'utf8'));
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: FABRIC_CONFIG.identity, discovery: { enabled: true, asLocalhost: true } });
    return gateway;
}

async function main() {
    if (AUTH_TOKEN.includes('PASTE') || AUTH_TOKEN.length < 20) {
        console.error("❌ ERROR: Harap ganti nilai 'AUTH_TOKEN' di dalam skrip dengan token JWT yang valid.");
        return;
    }

    console.log(`🚀 Memulai Pengujian Integritas Data untuk ${JUMLAH_TRANSAKSI} Transaksi Produksi...`);
    const createdBatchIds = []; 
    
    const dummyFilePath = path.join(__dirname, 'dummy_doc.pdf');
    if (!fs.existsSync(dummyFilePath)) {
        fs.writeFileSync(dummyFilePath, 'Ini adalah dokumen dummy untuk pengujian.');
    }
    
    // ----------------------------------------------------------------- //
    // TAHAP 1: MEMBUAT DAN MENCATAT DATA UJI
    // ----------------------------------------------------------------- //
    console.log('\n--- TAHAP 1: Membuat Data Uji di MySQL & Blockchain ---');
    for (let i = 1; i <= JUMLAH_TRANSAKSI; i++) {
        const batchId = `UJI-INTEGRITAS-${Date.now()}-${i}`;
        
        const form = new FormData();
        form.append('batch_id', batchId);
        form.append('nama_obat', `Obat Uji Integritas ${i}`);
        form.append('nomor_izin_edar', `GKL${Date.now()}`);
        form.append('dosis', '500 mg');
        form.append('bentuk_sediaan', 'Tablet');
        form.append('jumlah', '500');
        form.append('tanggal_produksi', '2025-10-01');
        form.append('tanggal_kadaluarsa', '2027-10-01');
        form.append('prioritas', 'Medium');
        form.append('status', 'Selesai');
        form.append('komposisi_obat', 'Bahan Uji 500mg');
        form.append('penanggung_jawab', 'Sistem Uji');
        form.append('harga_per_unit', '1500');
        
        form.append('dokumen_bpom', fs.createReadStream(dummyFilePath));
        form.append('sertifikat_analisis', fs.createReadStream(dummyFilePath));

        try {
            // Panggil API untuk membuat data di MySQL
            const createResponse = await axios.post(`${API_BASE_URL}/produksi`, form, {
                 headers: { ...form.getHeaders(), 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });

            const newProduksiId = createResponse.data.id;
            console.log(`[${i}/${JUMLAH_TRANSAKSI}] MySQL OK (ID: ${newProduksiId}, Batch: ${batchId})`);

            // // Panggil API untuk mencatat ke blockchain
            // await axios.post(`${API_BASE_URL}/produksi/${newProduksiId}/record`, {}, {
            //     headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
            // });
            // console.log(`[${i}/${JUMLAH_TRANSAKSI}] Blockchain OK (Batch: ${batchId})`);
            
            createdBatchIds.push(batchId);
        } catch (error) {
            const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`❌ Gagal pada iterasi ${i} (Batch: ${batchId}):`, errorMessage);
        }
    }
    
    fs.unlinkSync(dummyFilePath);

    // ----------------------------------------------------------------- //
    // TAHAP 2: VERIFIKASI DATA
    // ----------------------------------------------------------------- //
    console.log('\n--- TAHAP 2: Memverifikasi Konsistensi Data ---');
    if (createdBatchIds.length === 0) {
        console.log('Tidak ada data yang berhasil dibuat. Verifikasi dibatalkan.');
        return;
    }

    let dbConnection;
    let gateway;
    let dataCocok = 0;

    try {
        dbConnection = await mysql.createConnection(DB_CONFIG);
        const [mysqlRows] = await dbConnection.execute(
            `SELECT batch_id FROM produksi WHERE batch_id IN (?)`,
            [createdBatchIds]
        );
        const mysqlBatchIds = new Set(mysqlRows.map(row => row.batch_id));
        console.log(`Ditemukan ${mysqlBatchIds.size} data di MySQL untuk diverifikasi.`);

        gateway = await getGateway();
        const network = await gateway.getNetwork(FABRIC_CONFIG.channelName);
        const contract = network.getContract(FABRIC_CONFIG.chaincodeName);
        console.log('Berhasil terhubung ke Blockchain untuk verifikasi...');

        for (const batchId of mysqlBatchIds) {
            try {
                const onChainAsset = await contract.evaluateTransaction('readObat', batchId);
                if (onChainAsset.length > 0) {
                    dataCocok++;
                    // console.log(`✅ Cocok: Batch ID ${batchId}`); // Dinyalakan jika ingin lihat detail
                }
            } catch (err) {
                console.error(`❌ Tidak Cocok: Batch ID ${batchId} ada di MySQL tapi tidak ditemukan di Blockchain.`);
            }
        }
    } finally {
        if (dbConnection) await dbConnection.end();
        if (gateway) gateway.disconnect();
    }

    // ----------------------------------------------------------------- //
    // TAHAP 3: LAPORAN HASIL
    // ----------------------------------------------------------------- //
    console.log('\n--- TAHAP 3: Laporan Hasil Pengujian Integritas Data ---');
    console.log('======================================================');
    console.log(`Total Transaksi yang Dicoba      : ${JUMLAH_TRANSAKSI}`);
    console.log(`Total Berhasil Dicatat (End-to-End)  : ${createdBatchIds.length}`);
    console.log(`Total Data yang Cocok di Blockchain: ${dataCocok}`);
    console.log('------------------------------------------------------');
    const tingkatKonsistensi = (createdBatchIds.length > 0) ? (dataCocok / createdBatchIds.length) * 100 : 0;
    console.log(`✅ Tingkat Konsistensi Data       : ${tingkatKonsistensi.toFixed(2)}%`);
    console.log('======================================================');
}

main().catch(err => {
    console.error("Pengujian gagal dengan error fatal:", err);
});