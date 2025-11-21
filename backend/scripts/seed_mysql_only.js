// File: backend/scripts/seed_mysql_only.js
'use strict';
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// --- KONFIGURASI ---
const JUMLAH_DATA_UJI = 500; // Buat 500 data untuk diuji
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InByb2R1c2VuIiwidXNlcm5hbWUiOiJwcm9kdXNlbiIsIm5hbWFfcmVzbWkiOiJQVCBQYWxzdSA8c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ-Iiwibm9tb3JfaXppbiI6IjEyMzQ1IiwiaWF0IjoxNzYyOTUzMDc0LCJleHAiOjE3NjI5NTY2NzR9.cKFsPM0Ju9VxIDQyAILqTksO4SMC51iY_iY7ySWGs_Y'; 
// ---------------------

async function main() {
    if (AUTH_TOKEN.includes('PASTE')) { /* ... (Error check) ... */ }
    console.log(`🚀 Memulai Seeder untuk ${JUMLAH_DATA_UJI} data produksi (HANYA MySQL)...`);

    const createdProduksiIds = []; 
    const dummyFilePath = path.join(__dirname, 'dummy_doc.pdf');
    if (!fs.existsSync(dummyFilePath)) { fs.writeFileSync(dummyFilePath, 'dummy'); }

    for (let i = 1; i <= JUMLAH_DATA_UJI; i++) {
        const batchId = `UJI-JMeter-${Date.now()}-${i}`;
        const form = new FormData();
        form.append('batch_id', batchId);
        form.append('nama_obat', `Obat Uji JMeter ${i}`);
        form.append('nomor_izin_edar', `GKL-JMeter-${Date.now()}`);
        form.append('dosis', '500 mg');
        form.append('bentuk_sediaan', 'Tablet');
        form.append('jumlah', '500');
        form.append('tanggal_produksi', '2025-10-01');
        form.append('tanggal_kadaluarsa', '2027-10-01');
        form.append('prioritas', 'Medium');
        form.append('status', 'Selesai'); 
        form.append('penanggung_jawab', 'Sistem Uji');
        form.append('harga_per_unit', '1500');
        form.append('dokumen_bpom', fs.createReadStream(dummyFilePath));
        form.append('sertifikat_analisis', fs.createReadStream(dummyFilePath));

        try {
            const createResponse = await axios.post(`${API_BASE_URL}/produksi`, form, {
                 headers: { ...form.getHeaders(), 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });
            const newProduksiId = createResponse.data.id;
            console.log(`[${i}/${JUMLAH_DATA_UJI}] MySQL OK (ID: ${newProduksiId})`);
            createdProduksiIds.push(newProduksiId); 
        } catch (error) { /* ... (Error handling) ... */ }
    }

    fs.unlinkSync(dummyFilePath);

    // --- BUAT FILE CSV UNTUK GRUP 1 (ATTACKER) ---
    console.log('\n--- TAHAP 2: Membuat file CSV untuk JMeter (Attacker) ---');
    let csvContent = "mysql_id\n"; 
    csvContent += createdProduksiIds.join('\n');
    const csvFilePath = path.join(__dirname, 'produksi_ids.csv');
    fs.writeFileSync(csvFilePath, csvContent);
    console.log(`✅ Berhasil! File 'produksi_ids.csv' dengan ${createdProduksiIds.length} ID telah dibuat.`);
}
main().catch(console.error);