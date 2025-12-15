'use strict';
const { Contract } = require('fabric-contract-api');

// --- HELPER UNTUK TRANSIENT DATA (PDC) ---
// Membaca data rahasia yang dikirim via transient map (bukan args biasa)
function getTransientData(ctx, key) {
    const transientMap = ctx.stub.getTransient();
    if (transientMap.has(key)) {
        return transientMap.get(key).toString('utf8');
    }
    return null;
}

class ProdusenContract extends Contract {
    constructor() { super('ProdusenContract'); }

    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // --- REVISI CREATE OBAT (IMPLEMENTASI PDC) ---
    // Parameter sensitif (harga, komposisi, dosis, hash) DIHAPUS dari args
    // dan diambil lewat getTransientData
    async createObat(ctx, id, namaObat, nomorIzinEdar, tanggalProduksi, tanggalKadaluarsa, bentukSediaan, penanggungJawab, jumlah, namaPerusahaan, idProdusen) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') {
            throw new Error(`ERROR: Organisasi ${mspID} tidak diizinkan untuk membuat aset obat.`);
        }

        // 1. Validasi Input Dasar
        if (!namaPerusahaan || namaPerusahaan.trim() === '') {
            throw new Error('ERROR: Nama perusahaan wajib disediakan.');
        }
        if (!idProdusen) {
            throw new Error('ERROR: ID Produsen wajib disediakan.');
        }

        const exists = await this.assetExists(ctx, id);
        if (exists) {
            throw new Error(`ERROR: Obat dengan ID Batch ${id} sudah ada.`);
        }

        // 2. Ambil Data Rahasia dari Transient
        const hargaPerUnit = getTransientData(ctx, 'hargaPerUnit');
        const komposisi = getTransientData(ctx, 'komposisi');
        const dosis = getTransientData(ctx, 'dosis');
        const hashHasilUjiMutu = getTransientData(ctx, 'hashHasilUjiMutu');

        // Validasi data privat
        if (!hargaPerUnit || !komposisi || !dosis) {
            throw new Error('ERROR: Data privat (harga, komposisi, dosis) wajib dikirim via Transient Data.');
        }

        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        // 3. Objek PUBLIK (Disimpan di World State - Bisa dilihat semua org di channel)
        // Hanya berisi data logistik/traceability
        const publicObat = {
            docType: 'obat',
            id: id,
            namaObat: namaObat,
            nomorIzinEdar: nomorIzinEdar,
            bentukSediaan: bentukSediaan,
            tanggalProduksi: tanggalProduksi,
            tanggalKadaluarsa: tanggalKadaluarsa,
            penanggungJawab: penanggungJawab,
            jumlah: Number(jumlah) || 0,
            pemilikSaatIni: mspID, // "ProdusenMSP"
            statusSaatIni: 'DIPRODUKSI',
            namaPerusahaan: namaPerusahaan,
            
            // Relasional ID
            idProdusen: idProdusen,
            idPbf: null, 
            idApotek: null,
            
            riwayat: [{
                pemilik: mspID,
                status: 'DIPRODUKSI',
                timestamp: timestamp,
                detail: `Diproduksi oleh ${namaPerusahaan}`,
                idProdusen: idProdusen
            }]
        };

        // 4. Objek PRIVAT (Disimpan di SideDB 'collectionPrivate')
        // Hanya bisa dilihat oleh Member Org yang terdaftar di policy collection
        const privateObat = {
            id: id, // Link key
            hargaPerUnit: Number(hargaPerUnit) || 0,
            komposisi: komposisi,
            dosis: dosis,
            hashDokumen: {
                hasilUjiMutu: hashHasilUjiMutu || '', // Opsional
                suratJalan: ''
            }
        };

        // 5. Simpan ke Ledger
        // A. Simpan Publik
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(publicObat)));

        // B. Simpan Privat (Sesuai nama di collections_config.json)
        await ctx.stub.putPrivateData('collectionPrivate', id, Buffer.from(JSON.stringify(privateObat)));

        return JSON.stringify({ success: true, message: `Obat ${id} berhasil dibuat dengan perlindungan PDC.` });
    }

    // --- REVISI READ OBAT (GABUNG DATA) ---
    async readObat(ctx, id) {
        // 1. Ambil Data Publik
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan di Public Ledger.`);
        }
        const publicData = JSON.parse(assetJSON.toString());

        // 2. Coba Ambil Data Privat
        let privateData = {};
        try {
            // Ini akan gagal/kosong jika user yang request tidak punya izin baca collectionPrivate
            const privateDataBuffer = await ctx.stub.getPrivateData('collectionPrivate', id);
            if (privateDataBuffer && privateDataBuffer.length > 0) {
                privateData = JSON.parse(privateDataBuffer.toString());
            }
        } catch (err) {
            // Ignore error permission, kembalikan public data saja
            console.log(`User tidak memiliki akses data privat untuk ${id}`);
        }

        // 3. Gabungkan (Merge)
        // Hapus ID dari privateData agar tidak duplikat property
        const { id: _, ...safePrivateData } = privateData;
        
        const fullData = {
            ...publicData,
            ...safePrivateData // Menambahkan harga, komposisi, dll (jika akses tersedia)
        };

        return JSON.stringify(fullData);
    }

    // --- QUERY STANDARD (HANYA CEK PUBLIC STATE) ---
    async queryAssetsByProdusen(ctx, namaPerusahaan) {
        const producerMSP = 'ProdusenMSP'; 
        const queryString = {
            selector: {
                docType: 'obat',
                namaPerusahaan: namaPerusahaan,
                pemilikSaatIni: producerMSP 
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allResults = [];
        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value.toString()) {
                const strValue = result.value.value.toString('utf8');
                try {
                    allResults.push(JSON.parse(strValue));
                } catch (err) {
                    allResults.push(strValue);
                }
            }
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }

    // --- REVISI TRANSFER (COPY PRIVATE DATA) ---
    async transferToPbf(ctx, idPesanan, hashSuratJalan, namaPbf, idPbf, obatIdsJson, jumlahPesananJson) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') {
            throw new Error(`ERROR: Hanya Produsen yang bisa mentransfer ke PBF.`);
        }
        if (!idPbf) {
             throw new Error('ERROR: ID PBF wajib disediakan.');
        }

        const obatIds = JSON.parse(obatIdsJson);
        const jumlahPesananList = JSON.parse(jumlahPesananJson); 
        
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        const newAssetIds = [];

        for (const obatId of obatIds) {
            // A. Ambil Data Publik Asli
            const assetJSON = await ctx.stub.getState(obatId);
            if (!assetJSON || assetJSON.length === 0) {
                throw new Error(`ERROR: Obat dengan ID ${obatId} tidak ditemukan.`);
            }
            const obatAsli = JSON.parse(assetJSON.toString());

            // B. Ambil Data Privat Asli (PENTING: Produsen harus punya akses ini)
            const privateDataBuffer = await ctx.stub.getPrivateData('collectionPrivate', obatId);
            if (!privateDataBuffer || privateDataBuffer.length === 0) {
                throw new Error(`ERROR: Data privat untuk obat ${obatId} hilang atau korup.`);
            }
            const obatAsliPrivate = JSON.parse(privateDataBuffer.toString());


            if (obatAsli.pemilikSaatIni !== 'ProdusenMSP') {
                throw new Error(`ERROR: Obat ${obatId} bukan milik Produsen.`);
            }

            const pesananItem = jumlahPesananList.find(item => item.obatId === obatId);
            const jumlahDipesan = pesananItem ? Number(pesananItem.jumlah) : 0;
            
            if (obatAsli.jumlah < jumlahDipesan) {
                throw new Error(`ERROR: Stok tidak cukup.`);
            }

            // 1. Update Aset Induk (Produsen) - Public State Saja
            obatAsli.jumlah -= jumlahDipesan;
            obatAsli.riwayat.push({
                pemilik: 'ProdusenMSP',
                status: 'DIKIRIM_KE_PBF',
                timestamp: timestamp,
                detail: `Transfer ke ${namaPbf} (Pesanan: ${idPesanan}). Jumlah: ${jumlahDipesan}.`
            });
            await ctx.stub.putState(obatAsli.id, Buffer.from(JSON.stringify(obatAsli)));

            // 2. Buat Aset Baru (Pecahan untuk PBF)
            const pbfAssetId = `${obatId}-${idPesanan}`; 
            
            // Public Data Baru
            const pbfAssetPublic = {
                docType: 'obat',
                id: pbfAssetId,
                namaObat: obatAsli.namaObat,
                nomorIzinEdar: obatAsli.nomorIzinEdar,
                bentukSediaan: obatAsli.bentukSediaan,
                tanggalProduksi: obatAsli.tanggalProduksi,
                tanggalKadaluarsa: obatAsli.tanggalKadaluarsa,
                penanggungJawab: obatAsli.penanggungJawab,
                jumlah: Number(jumlahDipesan),
                pemilikSaatIni: 'PBFMSP', 
                statusSaatIni: 'DIKIRIM_KE_PBF', 
                namaPerusahaan: obatAsli.namaPerusahaan,
                riwayat: [ ...obatAsli.riwayat, {
                    pemilik: 'PBFMSP',
                    status: 'DIKIRIM_KE_PBF',
                    timestamp: timestamp,
                    detail: `Diterima dari Produsen (PO: ${idPesanan})`
                }], 
                idProdusen: obatAsli.idProdusen, 
                idPbf: idPbf,
                idApotek: null,
                idBatchAsal: obatId
            };

            // Private Data Baru (Copy dari induk)
            // Kita gunakan data yang sama untuk harga/komposisi
            // Hash surat jalan ditambahkan ke sini karena bersifat dokumen transaksi
            const pbfAssetPrivate = {
                id: pbfAssetId,
                hargaPerUnit: obatAsliPrivate.hargaPerUnit, // Copy Harga
                komposisi: obatAsliPrivate.komposisi,       // Copy Komposisi
                dosis: obatAsliPrivate.dosis,               // Copy Dosis
                hashDokumen: {
                    hasilUjiMutu: obatAsliPrivate.hashDokumen.hasilUjiMutu,
                    suratJalan: hashSuratJalan // Update Surat Jalan
                }
            };

            // Cek Duplikasi
            const pbfAssetExists = await this.assetExists(ctx, pbfAssetId);
            if (pbfAssetExists) {
                throw new Error(`ERROR: Aset kiriman PBF ID ${pbfAssetId} sudah ada.`);
            }

            // Simpan Aset Baru (Public & Private)
            await ctx.stub.putState(pbfAssetId, Buffer.from(JSON.stringify(pbfAssetPublic)));
            
            // Simpan ke collectionPrivate agar PBF (yang juga member collectionPrivate) bisa baca
            await ctx.stub.putPrivateData('collectionPrivate', pbfAssetId, Buffer.from(JSON.stringify(pbfAssetPrivate)));
            
            newAssetIds.push(pbfAssetId);
        }

        return JSON.stringify({ 
            success: true, 
            message: `Transfer PDC berhasil untuk pesanan ${idPesanan}.`,
            createdAssetIds: newAssetIds 
        });
    }

    async getObatIdsByPesanan(ctx, idPesanan) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('pesanan~obat', [idPesanan]);
        const results = [];
        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value.toString()) {
                const strValue = result.value.value.toString('utf8');
                const record = JSON.parse(strValue);
                results.push(record.obatId);
            }
            result = await iterator.next();
        }
        await iterator.close();
        return results;
    }
}

module.exports = ProdusenContract;