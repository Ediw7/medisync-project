'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// ================================================================= //
// == KONFIGURASI PENGUJIAN (Ubah sesuai kebutuhan Anda) == //
// ================================================================= //
const JUMLAH_DATA_UJI = 1000; // Jumlah data yang ingin Anda buat
const API_BASE_URL = 'http://localhost:5000/api';

// --- !!! GANTI DENGAN TOKEN PRODUSEN ANDA YANG VALID !!! ---
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InByb2R1c2VuIiwidXNlcm5hbWUiOiJwcm9kdXNlbiIsIm5hbWFfcmVzbWkiOiJQVCBQcm9kdXNlbiBBcG90ZWsiLCJub21vcl9pemluIjoiMTIzNDUiLCJpYXQiOjE3NjI1NDA1MzUsImV4cCI6MTc2MjU0NDEzNX0.bq2Ynw_JP9uv6kEl4euuekdMYYAm9m0aS9pHSP4gHMg'; 
// ================================================================= //

async function main() {
    if (AUTH_TOKEN.includes('PASTE') || AUTH_TOKEN.length < 20) {
        console.error("❌ ERROR: Harap ganti nilai 'AUTH_TOKEN' di dalam skrip dengan token JWT yang valid.");
        return;
    }

    console.log(`🚀 Memulai Seeder untuk ${JUMLAH_DATA_UJI} data produksi (HANYA MySQL)...`);
    
    // Array untuk menyimpan ID yang berhasil dibuat (untuk file CSV)
    const createdProduksiIds = []; 
    
    // Buat file dummy untuk di-upload
    const dummyFilePath = path.join(__dirname, 'dummy_doc.pdf');
    if (!fs.existsSync(dummyFilePath)) {
        fs.writeFileSync(dummyFilePath, 'Ini adalah dokumen dummy untuk pengujian.');
    }
    
    // ----------------------------------------------------------------- //
    // TAHAP 1: MEMBUAT DATA UJI (HANYA MySQL)
    // ----------------------------------------------------------------- //
    console.log('\n--- TAHAP 1: Membuat Data Uji di MySQL ---');
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
        // --- PENTING: Status 'Selesai' agar siap di-record ---
        form.append('status', 'Selesai'); 
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
            console.log(`[${i}/${JUMLAH_DATA_UJI}] MySQL OK (ID: ${newProduksiId}, Batch: ${batchId})`);

            // --- Panggilan API ke Blockchain DINONAKTIFKAN ---
            // await axios.post(`${API_BASE_URL}/produksi/${newProduksiId}/record`, ...);
            
            // Simpan ID dari MySQL (bukan batch_id)
            createdProduksiIds.push(newProduksiId); 

        } catch (error) {
            const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`❌ Gagal pada iterasi ${i} (Batch: ${batchId}):`, errorMessage);
        }
    }
    
    fs.unlinkSync(dummyFilePath);

    // ----------------------------------------------------------------- //
    // TAHAP 2: MEMBUAT FILE CSV UNTUK JMETER
    // ----------------------------------------------------------------- //
    console.log('\n--- TAHAP 2: Membuat file CSV untuk JMeter ---');
    if (createdProduksiIds.length === 0) {
        console.log('Tidak ada data yang berhasil dibuat. File CSV tidak akan dibuat.');
        return;
    }

    try {
        // Buat header
        let csvContent = "mysql_id\n"; 
        
        // Tambahkan setiap ID ke baris baru
        csvContent += createdProduksiIds.join('\n');
        
        const csvFilePath = path.join(__dirname, 'produksi_ids.csv');
        fs.writeFileSync(csvFilePath, csvContent);

        console.log(`✅ Berhasil! File 'produksi_ids.csv' dengan ${createdProduksiIds.length} ID telah dibuat.`);
        console.log(`Lokasi file: ${csvFilePath}`);
        console.log("\nSekarang, pindahkan file 'produksi_ids.csv' ini ke folder 'bin/' JMeter Anda.");

    } catch (error) {
        console.error('❌ Gagal membuat file CSV:', error.message);
    }
}

main().catch(err => {
    console.error("Pengujian gagal dengan error fatal:", err);
});