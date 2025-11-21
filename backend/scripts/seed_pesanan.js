'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // Anda perlu menginstal ini

// ================================================================= //
// == KONFIGURASI (UBAH INI) == //
// ================================================================= //
const API_BASE_URL = 'http://localhost:5000/api';

// --- GANTI DENGAN TOKEN PBF ANDA YANG VALID ---
const PBF_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InBiZiIsInVzZXJuYW1lIjoicGJmIiwibmFtYV9yZXNtaSI6InB0IHBiZiAiLCJub21vcl9pemluIjoiMTIzIiwiaWF0IjoxNzYyOTU0NDQ5LCJleHAiOjE3NjI5NTgwNDl9.P8xzeKkDQzI3O8d3cNtjyQpwhy12vkyn-KBvTybLx0c'; 

// --- Data PBF (sesuai database dump Anda) ---
const ID_PRODUSEN = 1; // Pesan dari Produsen ID 1
const PBF_NAMA = "pt pbf ";
const PBF_ALAMAT = "semarang";
// ================================================================= //

const dataPesananUntukJMeter = [];

// Fungsi untuk membaca CSV
function readBatchIds() {
  return new Promise((resolve, reject) => {
    const batchIds = [];
    const csvPath = path.join(__dirname, 'batch_ids.csv');
    if (!fs.existsSync(csvPath)) {
      return reject(new Error("File 'batch_ids.csv' tidak ditemukan di folder /scripts."));
    }
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.batch_id) {
          batchIds.push(row.batch_id);
        }
      })
      .on('end', () => {
        console.log(`Berhasil memuat ${batchIds.length} Batch ID dari CSV.`);
        resolve(batchIds);
      })
      .on('error', reject);
  });
}

// Fungsi untuk membuat SATU pesanan PBF
async function createPesananPbf(batchId, index, total) {
  const dataPesanan = {
    id_produsen: ID_PRODUSEN,
    items: [{
      id_produksi: batchId, // Ini adalah Batch ID dari CSV
      nama_obat: `Obat Tes (dari ${batchId})`,
      bentuk_sediaan: "Tablet",
      dosis: "500 mg",
      jumlah_pesanan: 1, // Kita pesan 1 unit saja untuk tes
      harga_per_unit: 1000,
      total_harga: 1000
    }],
    nama_pbf: PBF_NAMA,
    alamat_pbf: PBF_ALAMAT,
    nomor_siup: "123",
    nomor_sia_sika: "5449.4/123/SIA/DPMPTSP/2025",
    nama_apoteker: "Edi",
    nomor_sipa: "449.4/067/SIPA/DINKES-KOTA/2025",
    kontak_telepon: "08123",
    kontak_email: "seeder@pbf.com",
    tanggal_pesanan: new Date().toISOString().split('T')[0],
    tujuan_distribusi: "Gudang PBF",
    tanda_tangan_data_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
  };

  try {
    // Panggil endpoint /api/pbf/pesanan
    const response = await axios.post(`${API_BASE_URL}/pbf/pesanan`, dataPesanan, {
      headers: { Authorization: `Bearer ${PBF_TOKEN}` }
    });
    
    console.log(`[${index}/${total}] ✅ Berhasil "Pesan Dulu": ID Pesanan ${response.data.idPesanan} (Batch: ${batchId})`);
    
    // Simpan data ini untuk tes JMeter (PERF-03)
    dataPesananUntukJMeter.push({
      idPesanan: response.data.idPesanan,
      batchId: batchId
    });

  } catch (err) {
    const errorMsg = err.response ? err.response.data.message : err.message;
    console.error(`[${index}/${total}] ❌ GAGAL "Pesan Dulu" (Batch: ${batchId}):`, errorMsg);
  }
}

// --- FUNGSI UTAMA ---
async function runSeederPesanan() {
  if (PBF_TOKEN.includes('PASTE')) {
    console.error("\n❌ ERROR: Harap ganti 'PBF_TOKEN' dengan token PBF Anda yang valid.");
    return;
  }
  
  try {
    const allBatchIds = await readBatchIds();
    if (allBatchIds.length === 0) {
      throw new Error("Tidak ada Batch ID di file 'batch_ids.csv'. Jalankan tes PERF-02 dulu.");
    }
    
    console.log(`\n--- Memulai Seeder "Pesan Dulu" untuk ${allBatchIds.length} pesanan ---`);
    
    for (let i = 0; i < allBatchIds.length; i++) {
      await createPesananPbf(allBatchIds[i], i + 1, allBatchIds.length);
      // Kita tambahkan jeda kecil agar tidak overload
      await new Promise(resolve => setTimeout(resolve, 100)); 
    }

    console.log("\n--- Seeding 'Pesan Dulu' Selesai ---");
    
    // Simpan data (idPesanan, batchId) ke file CSV baru untuk JMeter
    let csvContent = "idPesanan,batchId\n";
    csvContent += dataPesananUntukJMeter.map(d => `${d.idPesanan},${d.batchId}`).join('\n');
    
    const csvOutputPath = path.join(__dirname, 'transfer_data.csv');
    fs.writeFileSync(csvOutputPath, csvContent);

    console.log(`✅ Berhasil! File 'transfer_data.csv' dengan ${dataPesananUntukJMeter.length} pesanan siap pakai telah dibuat.`);
    console.log("Sekarang, pindahkan file 'transfer_data.csv' ini ke folder 'bin/' JMeter Anda dan jalankan tes PERF-03.");

  } catch (error) {
    console.log("\n--- Seeder Gagal Total ---");
    console.error(error.message);
  }
}

// 1. Instalasi: npm install csv-parser
// 2. Jalankan: node scripts/seed_pesanan.js
runSeederPesanan();