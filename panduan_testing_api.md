# Panduan Testing API MediSync (Postman)

Dokumen ini memandu pengujian fitur **PDC** dan **ABAC** secara manual via Postman, berdasarkan Skenario Pengujian di Bab 4 skripsi.

**Base URL:** `http://localhost:5000`

---

## 0. Prasyarat: Mendapatkan Token JWT

Sebelum menguji, login untuk mendapatkan token JWT.

### Login sebagai Admin Produsen

```
POST /api/auth/login
```

**Body (raw JSON):**

```json
{
  "username": "admin_produsen",
  "password": "password_anda"
}
```

> Ganti `username` dan `password` dengan kredensial Admin Produsen yang terdaftar di database MySQL.

**Respons Sukses (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "produsen",
  "username": "admin_produsen",
  "namaResmi": "PT Produsen Anis",
  "id": 1,
  "nomor_izin": "..."
}
```

**Simpan nilai `token`** — ini akan dipakai sebagai `Bearer Token` di semua request berikutnya.

### Login sebagai Admin PBF (untuk UJI-02)

```
POST /api/auth/login
```

```json
{
  "username": "admin_pbf",
  "password": "password_anda"
}
```

Simpan token ini secara terpisah (misal di Postman Environment variable `TOKEN_PBF`).

---

## UJI-01: Pencatatan Produksi (Happy Path)

Pengujian ini terdiri dari 2 tahap: membuat jadwal produksi (off-chain), lalu mencatatnya ke blockchain (on-chain dengan PDC).

### Tahap 1: Buat Jadwal Produksi (Off-Chain ke MySQL)

```
POST /api/produksi
```

**Headers:**

| Key             | Value                     |
|-----------------|---------------------------|
| `Authorization` | `Bearer <TOKEN_PRODUSEN>` |
| `Content-Type`  | `application/json`        |

**Body (raw JSON):**

```json
{
  "nama_obat": "Amoxicillin 500mg",
  "nomor_izin_edar": "NIE-2025-001",
  "dosis": "3x1 Sehari",
  "bentuk_sediaan": "Kapsul",
  "jumlah": 500,
  "tanggal_produksi": "2026-03-01",
  "tanggal_kadaluarsa": "2027-12-31",
  "prioritas": "High",
  "status": "Selesai",
  "komposisi_obat": "Amoxicillin Trihydrate 500mg",
  "penanggung_jawab": "apt. Budi Santoso, S.Farm",
  "harga_per_unit": 15000
}
```

> **Penting:** Status harus `"Selesai"` agar bisa dicatat ke blockchain di tahap selanjutnya.

**Respons yang Diharapkan (201):**

```json
{
  "success": true,
  "message": "Jadwal produksi berhasil dibuat",
  "id": 201,
  "generated_batch_id": "P1-20260301-A1B2C3D4"
}
```

**Catat nilai `id`** (misal: `201`) — ini dibutuhkan untuk tahap 2.

### Tahap 2: Catat ke Blockchain dengan PDC (On-Chain)

```
POST /api/produksi/201/record
```

> Ganti `201` dengan `id` yang diperoleh dari Tahap 1.

**Headers:**

| Key             | Value                     |
|-----------------|---------------------------|
| `Authorization` | `Bearer <TOKEN_PRODUSEN>` |

**Body:** Kosong (tidak diperlukan — data diambil dari MySQL berdasarkan ID).

**Apa yang terjadi di balik layar:**
1. Controller mengambil data dari MySQL (termasuk `harga_per_unit`, `komposisi_obat`)
2. Data sensitif (`harga_per_unit`, `komposisi_obat`, `dosis`, `hash_sertifikat_analisis`) dikemas ke **objek Transient Map** sebagai Buffer
3. `transaction.setTransient(transientData)` mengirim data rahasia via jalur aman
4. `transaction.submit(...)` hanya mengirim data publik (batch_id, nama_obat, nomor_izin_edar, tanggal, bentuk_sediaan, penanggung_jawab, jumlah, nama_perusahaan, id_produsen)
5. Chaincode memvalidasi ABAC (`assertAttributeValue('role', 'produsen')`)
6. Data publik disimpan ke World State via `putState()`
7. Data privat disimpan ke SideDB via `putPrivateData('collectionPrivate', ...)`

**Respons yang Diharapkan (200):**

```json
{
  "success": true,
  "message": "Batch P1-20260301-A1B2C3D4 berhasil dicatat ke blockchain (PDC Aktif).",
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

**Indikator Keberhasilan:**
- Pesan mengandung teks **"PDC Aktif"**
- QR Code berhasil di-generate
- Status batch di MySQL berubah menjadi `"Tercatat di Blockchain"`

---

## UJI-02: Validasi ABAC (Negative Test — Akses Ditolak)

### Skenario: Admin PBF mencoba mencatat produksi obat

Login sebagai Admin PBF (lihat Prasyarat) dan gunakan token PBF untuk menembak endpoint yang sama.

```
POST /api/produksi/201/record
```

**Headers:**

| Key             | Value                 |
|-----------------|-----------------------|
| `Authorization` | `Bearer <TOKEN_PBF>` |

**Body:** Kosong.

**Respons yang Diharapkan — Penolakan Berlapis:**

Ada **dua lapisan pertahanan** yang akan menolak request ini. Penolakan terjadi di lapisan pertama yang ditemui:

### Lapisan 1: Middleware `authorizeRole` (Backend)

Jika token PBF memiliki `role: "pbf"` (bukan `"produsen"`), middleware akan langsung menolak:

```json
{
  "message": "Akses ditolak. Hanya untuk peran produsen."
}
```

**Status HTTP:** `403 Forbidden`

> Penolakan ini terjadi **sebelum** transaksi sampai ke blockchain. Request bahkan tidak menyentuh chaincode.

### Lapisan 2: Chaincode ABAC (Jika Token Tidak Terkena Middleware)

Jika entah bagaimana request lolos middleware (misal: endpoint `/api/blockchain/obat` POST yang tidak punya `authorizeRole`), chaincode akan menolak di level lebih dalam:

**2a. MSP Check:**
```
ERROR: Organisasi PBFMSP tidak diizinkan untuk membuat aset obat.
```

**2b. Attribute Check (`assertAttributeValue`):**
```
Attribute value of 'role' is 'admin_pbf', not 'produsen'
```

**Status HTTP:** `500 Internal Server Error`

```json
{
  "error": "Attribute value of 'role' is 'admin_pbf', not 'produsen'"
}
```

### Cara Menguji Langsung di Chaincode Level (Opsional)

Untuk menguji ABAC di level chaincode secara langsung (melewati middleware), gunakan endpoint alternatif:

```
POST /api/blockchain/obat
```

**Headers:**

| Key             | Value                 |
|-----------------|-----------------------|
| `Authorization` | `Bearer <TOKEN_PBF>` |
| `Content-Type`  | `application/json`    |

**Body (raw JSON):**

```json
{
  "id": "TEST-ABAC-001",
  "namaObat": "Test Obat ABAC",
  "nomorIzinEdar": "NIE-TEST-001",
  "tanggalProduksi": "2026-03-01",
  "tanggalKadaluarsa": "2027-12-31",
  "bentukSediaan": "Tablet",
  "penanggungJawab": "apt. Test",
  "jumlah": 100,
  "namaPerusahaan": "PT Test",
  "idProdusen": "1",
  "dataPrivat": {
    "hargaPerUnit": 10000,
    "komposisi": "Test Komposisi",
    "dosis": "1x1",
    "hashHasilUjiMutu": "abc123"
  }
}
```

> Endpoint ini menggunakan `authenticateToken` tanpa `authorizeRole`, sehingga request akan menembus ke chaincode dan **ABAC di chaincode** yang akan menolaknya.

**Respons yang Diharapkan (500):**

```json
{
  "error": "ERROR: Organisasi PBFMSP tidak diizinkan untuk membuat aset obat."
}
```

Atau jika MSP cocok tapi atribut role salah:

```json
{
  "error": "Attribute value of 'role' is 'admin_pbf', not 'produsen'"
}
```

---

## UJI-03: Privasi Data PDC

### Langkah A: Verifikasi Data TIDAK Terlihat di Query Publik (World State)

Setelah UJI-01 berhasil, query batch tersebut melalui endpoint publik:

```
GET /api/blockchain/obat/P1-20260301-A1B2C3D4
```

> Ganti dengan batch_id yang sebenarnya. Endpoint ini **tidak memerlukan token** (akses publik).

**Headers:** Tidak diperlukan.

**Respons yang Diharapkan (200):**

```json
{
  "docType": "obat",
  "id": "P1-20260301-A1B2C3D4",
  "namaObat": "Amoxicillin 500mg",
  "nomorIzinEdar": "NIE-2025-001",
  "bentukSediaan": "Kapsul",
  "tanggalProduksi": "2026-03-01",
  "tanggalKadaluarsa": "2027-12-31",
  "penanggungJawab": "apt. Budi Santoso, S.Farm",
  "jumlah": 500,
  "pemilikSaatIni": "ProdusenMSP",
  "statusSaatIni": "DIPRODUKSI",
  "namaPerusahaan": "PT Produsen Anis",
  "idProdusen": "1",
  "idPbf": null,
  "idApotek": null,
  "riwayat": [...]
}
```

**Yang Harus Diverifikasi:**

| Field              | Harus Ada? | Penjelasan                             |
|--------------------|------------|----------------------------------------|
| `namaObat`         | ✅ Ya      | Data publik (World State)              |
| `nomorIzinEdar`    | ✅ Ya      | Data publik                            |
| `statusSaatIni`    | ✅ Ya      | Data publik                            |
| `hargaPerUnit`     | ❌ Tidak   | **Data privat — tersimpan di SideDB**  |
| `komposisi`        | ❌ Tidak   | **Data privat — tersimpan di SideDB**  |
| `dosis`            | ❌ Tidak   | **Data privat — tersimpan di SideDB**  |
| `hashDokumen`      | ❌ Tidak   | **Data privat — tersimpan di SideDB**  |

> **Kunci pengujian:** Pastikan field `hargaPerUnit`, `komposisi`, `dosis`, dan `hashDokumen` **TIDAK ADA** di respons JSON. Jika masih muncul, berarti PDC belum berfungsi.

### Langkah B: Verifikasi Alternatif via Endpoint Publik Detail

```
GET /api/public/blockchain-detail/P1-20260301-A1B2C3D4
```

**Headers:** Tidak diperlukan.

**Respons yang Diharapkan (200):**

```json
{
  "success": true,
  "data": {
    "batch_id": "P1-20260301-A1B2C3D4",
    "nama_obat": "Amoxicillin 500mg",
    "tanggal_produksi": "2026-03-01",
    "tanggal_kadaluarsa": "2027-12-31",
    "penanggung_jawab": "apt. Budi Santoso, S.Farm",
    "jumlah": 500,
    "status_saat_ini": "DIPRODUKSI",
    "nama_perusahaan": "PT Produsen Anis",
    "riwayat": [...]
  }
}
```

> **Perhatikan:** Field `hash_sertifikat` pada respons ini akan kosong/`""` karena `hashDokumen` sudah dipindahkan ke objek privat di SideDB. Ini menandakan bahwa data tersebut **tidak lagi tersimpan di World State**.

### Langkah C: Verifikasi Data TERLIHAT oleh Pemilik Sah (Admin Produsen)

Login kembali sebagai Admin Produsen dan query detail dari endpoint yang terautentikasi:

```
GET /api/produksi/blockchain-detail/P1-20260301-A1B2C3D4
```

**Headers:**

| Key             | Value                     |
|-----------------|---------------------------|
| `Authorization` | `Bearer <TOKEN_PRODUSEN>` |

**Respons yang Diharapkan (200):**

```json
{
  "success": true,
  "data": {
    "batch_id": "P1-20260301-A1B2C3D4",
    "nama_obat": "Amoxicillin 500mg",
    "tanggal_produksi": "2026-03-01",
    "tanggal_kadaluarsa": "2027-12-31",
    "penanggung_jawab": "apt. Budi Santoso, S.Farm",
    "jumlah": 500,
    "status_saat_ini": "DIPRODUKSI",
    "nama_perusahaan": "PT Produsen Anis",
    "riwayat": [...]
  }
}
```

> **Catatan:** Endpoint ini saat ini membaca dari `readObat` (World State) dan menggabungkan dengan data MySQL. Data harga dan komposisi **tetap bisa diakses** oleh admin produsen melalui MySQL (`produksi` table), meskipun tidak tampil dari blockchain langsung. Ini adalah fitur keamanan: data privat di blockchain tersimpan di SideDB, tapi data operasional tetap tersedia di database relasional untuk keperluan aplikasi.

---

## Ringkasan Matriks Pengujian

| Kode   | Skenario                | Endpoint                               | Token          | Expected HTTP | Expected Result                        |
|--------|-------------------------|----------------------------------------|----------------|---------------|----------------------------------------|
| UJI-01 | Buat Jadwal             | `POST /api/produksi`                   | Produsen       | 201           | Jadwal tersimpan di MySQL              |
| UJI-01 | Catat ke Blockchain     | `POST /api/produksi/:id/record`        | Produsen       | 200           | PDC Aktif, QR Code generated           |
| UJI-02 | ABAC Middleware         | `POST /api/produksi/:id/record`        | PBF            | 403           | "Akses ditolak. Hanya untuk peran produsen." |
| UJI-02 | ABAC Chaincode          | `POST /api/blockchain/obat`            | PBF            | 500           | "Organisasi PBFMSP tidak diizinkan..." |
| UJI-03 | Query Publik (no auth)  | `GET /api/blockchain/obat/:batch_id`   | Tidak ada      | 200           | Harga & komposisi TIDAK ada di respons |
| UJI-03 | Detail Publik           | `GET /api/public/blockchain-detail/:id`| Tidak ada      | 200           | hash_sertifikat kosong / `""`          |
| UJI-03 | Detail oleh Pemilik     | `GET /api/produksi/blockchain-detail/:id` | Produsen    | 200           | Data lengkap (via MySQL + blockchain)  |
