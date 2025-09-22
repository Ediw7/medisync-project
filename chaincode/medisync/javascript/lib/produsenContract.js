'use strict';
const { Contract } = require('fabric-contract-api');

class ProdusenContract extends Contract {
    constructor() { super('ProdusenContract'); }

    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    async createObat(ctx, id, namaObat, nomorIzinEdar, komposisi, dosis, tanggalProduksi, tanggalKadaluarsa, bentukSediaan, penanggungJawab, jumlah, hargaPerUnit, hashHasilUjiMutu, namaPerusahaan) {
    const mspID = ctx.clientIdentity.getMSPID();
    if (mspID !== 'ProdusenMSP') {
        throw new Error(`ERROR: Organisasi ${mspID} tidak diizinkan untuk membuat aset obat.`);
    }

    if (!namaPerusahaan || namaPerusahaan.trim() === '') {
        throw new Error('ERROR: Nama perusahaan (dari nama_resmi di DB users) wajib disediakan dan tidak boleh kosong.');
    }

    const exists = await this.assetExists(ctx, id);
    if (exists) {
        throw new Error(`ERROR: Obat dengan ID Batch ${id} sudah ada.`);
    }

    const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

    const obat = {
        docType: 'obat',
        id: id,
        namaObat: namaObat,
        nomorIzinEdar: nomorIzinEdar,
        komposisi: komposisi,
        dosis: dosis,
        bentukSediaan: bentukSediaan,
        tanggalProduksi: tanggalProduksi,
        tanggalKadaluarsa: tanggalKadaluarsa,
        penanggungJawab: penanggungJawab,
        jumlah: Number(jumlah) || 0,
        hargaPerUnit: Number(hargaPerUnit) || 0,
        pemilikSaatIni: mspID,
        statusSaatIni: 'DIPRODUKSI',
        hashDokumen: {
            hasilUjiMutu: hashHasilUjiMutu,
            suratJalan: ''
        },
        namaPerusahaan: namaPerusahaan,  // Sekarang defined dari param (dari DB)
        riwayat: [{
            pemilik: mspID,
            status: 'DIPRODUKSI',
            timestamp: timestamp
        }]
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
    return JSON.stringify(obat);
}

    async readObat(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        return assetJSON.toString();
    }

    // <-- PERUBAHAN: Fungsi transferToPbf dirombak total
    async transferToPbf(ctx, idPesanan, hashSuratJalan, namaPbf, obatIdsJson, jumlahPesananJson) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') {
            throw new Error(`ERROR: Hanya Produsen yang bisa mentransfer ke PBF.`);
        }

        const obatIds = JSON.parse(obatIdsJson);
        const jumlahPesananList = JSON.parse(jumlahPesananJson); // Array [{obatId, jumlah}, ...]
        if (!obatIds || obatIds.length === 0 || !jumlahPesananList || jumlahPesananList.length === 0) {
            throw new Error(`ERROR: Tidak ada ID obat atau jumlah pesanan yang valid untuk pesanan ${idPesanan}.`);
        }
        
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        const newAssetIds = [];

        for (const obatId of obatIds) {
            const assetJSON = await ctx.stub.getState(obatId);
            if (!assetJSON || assetJSON.length === 0) {
                throw new Error(`ERROR: Obat dengan ID ${obatId} tidak ditemukan.`);
            }
            const obatAsli = JSON.parse(assetJSON.toString());

            if (obatAsli.pemilikSaatIni !== 'ProdusenMSP') {
                throw new Error(`ERROR: Obat dengan ID ${obatId} tidak dimiliki oleh Produsen.`);
            }

            // Cari jumlah pesanan untuk obat ini
            const pesananItem = jumlahPesananList.find(item => item.obatId === obatId);
            const jumlahDipesan = pesananItem ? Number(pesananItem.jumlah) : 0;
            if (jumlahDipesan <= 0) {
                throw new Error(`ERROR: Jumlah pesanan untuk obat ${obatId} tidak valid.`);
            }
            if (obatAsli.jumlah < jumlahDipesan) {
                throw new Error(`ERROR: Stok obat ${obatId} (${obatAsli.jumlah}) tidak cukup untuk pesanan ${jumlahDipesan}.`);
            }

            // 1. Update batch asli (kurangi jumlah, tambahkan riwayat)
            obatAsli.jumlah -= jumlahDipesan;
            obatAsli.riwayat.push({
                pemilik: 'ProdusenMSP', // Pemilik tetap sama
                status: 'DIKIRIM_KE_PBF',
                timestamp: timestamp,
                detail: `Transfer ke ${namaPbf} (Pesanan: ${idPesanan}). Jumlah: ${jumlahDipesan}. Sisa stok: ${obatAsli.jumlah}.`
            });
            await ctx.stub.putState(obatAsli.id, Buffer.from(JSON.stringify(obatAsli)));

            // 2. Buat aset baru untuk PBF (Asset Splitting)
            const pbfAssetId = `${obatId}-${idPesanan}`; // ID unik untuk kiriman ini
            const pbfAsset = {
                docType: 'obat', // Menggunakan docType yang sama agar mudah dicari
                id: pbfAssetId,
                namaObat: obatAsli.namaObat,
                nomorIzinEdar: obatAsli.nomorIzinEdar,
                komposisi: obatAsli.komposisi,
                dosis: obatAsli.dosis,
                bentukSediaan: obatAsli.bentukSediaan,
                tanggalProduksi: obatAsli.tanggalProduksi,
                tanggalKadaluarsa: obatAsli.tanggalKadaluarsa,
                penanggungJawab: obatAsli.penanggungJawab,
                hargaPerUnit: obatAsli.hargaPerUnit,
                jumlah: Number(jumlahDipesan), // Jumlah yang dikirim
                pemilikSaatIni: 'PBFMSP', // Pemilik baru adalah PBF
                statusSaatIni: 'DIKIRIM_KE_PBF', 
                hashDokumen: {
                    hasilUjiMutu: obatAsli.hashDokumen.hasilUjiMutu, // Warisi hash mutu
                    suratJalan: hashSuratJalan
                },
                namaPerusahaan: obatAsli.namaPerusahaan,
                riwayat: [{
                    pemilik: 'PBFMSP',
                    status: 'DIKIRIM_KE_PBF',
                    timestamp: timestamp,
                    detail: `Diterima dari ProdusenMSP (Pesanan: ${idPesanan}). Surat Jalan hash: ${hashSuratJalan}, Jumlah: ${jumlahDipesan}`
                }],
                idBatchAsal: obatId // Referensi ke batch asal
            };

            // Pastikan ID aset baru belum ada
            const pbfAssetExists = await this.assetExists(ctx, pbfAssetId);
            if (pbfAssetExists) {
                throw new Error(`ERROR: Aset kiriman PBF dengan ID ${pbfAssetId} sudah ada.`);
            }

            await ctx.stub.putState(pbfAssetId, Buffer.from(JSON.stringify(pbfAsset)));
            newAssetIds.push(pbfAssetId);
        }

        return JSON.stringify({ 
            success: true, 
            message: `Transfer berhasil untuk pesanan ID ${idPesanan} ke ${namaPbf}.`,
            createdAssetIds: newAssetIds 
        });
    }
    // --> AKHIR PERUBAHAN

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