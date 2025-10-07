'use strict';
const { Contract } = require('fabric-contract-api');

class PbfContract extends Contract {
    constructor() { super('PbfContract'); }

    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    async terimaBarang(ctx, batchId, hashBuktiFoto) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'PBFMSP') {
            throw new Error(`ERROR: Hanya PBF yang bisa menerima barang.`);
        }

        const assetJSON = await ctx.stub.getState(batchId);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Obat dengan Batch ID ${batchId} tidak ditemukan.`);
        }

        const obat = JSON.parse(assetJSON.toString());
        
        if (obat.statusSaatIni !== 'DIKIRIM_KE_PBF') {
            throw new Error(`ERROR: Aset ${batchId} tidak dalam status pengiriman.`);
        }

        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.pemilikSaatIni = 'PBFMSP';
        obat.statusSaatIni = 'DITERIMA_PBF';
        
        obat.riwayat.push({
            pemilik: 'PBFMSP',
            status: 'DITERIMA_PBF',
            timestamp: timestamp,
            detail: `Barang diterima. Hash bukti foto: ${hashBuktiFoto}`
        });

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }

    // <-- PERUBAHAN: Fungsi transferToApotek dirombak total mirip transferToPbf
    async transferToApotek(ctx, idPesanan, hashSuratJalan, namaApotek, obatIdsJson, jumlahPesananJson) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'PBFMSP') {
            throw new Error(`ERROR: Hanya PBF yang bisa mentransfer ke Apotek.`);
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

            if (obatAsli.pemilikSaatIni !== 'PBFMSP') {
                throw new Error(`ERROR: Obat dengan ID ${obatId} tidak dimiliki oleh PBF.`);
            }

            if (obatAsli.statusSaatIni !== 'DITERIMA_PBF') {
                throw new Error(`ERROR: Obat dengan ID ${obatId} tidak dalam status siap dikirim.`);
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
                pemilik: 'PBFMSP', // Pemilik tetap sama
                status: 'DIKIRIM_KE_APOTEK',
                timestamp: timestamp,
                detail: `Transfer ke ${namaApotek} (Pesanan: ${idPesanan}). Jumlah: ${jumlahDipesan}. Sisa stok: ${obatAsli.jumlah}.`
            });
            await ctx.stub.putState(obatAsli.id, Buffer.from(JSON.stringify(obatAsli)));

            // 2. Buat aset baru untuk Apotek (Asset Splitting)
            const apotekAssetId = `${obatId}-${idPesanan}`; // ID unik untuk kiriman ini
            const apotekAsset = {
                docType: 'obat', // Menggunakan docType yang sama agar mudah dicari
                id: apotekAssetId,
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
                pemilikSaatIni: 'ApotekMSP', // Pemilik baru adalah Apotek
                statusSaatIni: 'DIKIRIM_KE_APOTEK', 
                hashDokumen: {
                    hasilUjiMutu: obatAsli.hashDokumen.hasilUjiMutu, // Warisi hash mutu
                    suratJalan: hashSuratJalan
                },
                namaPerusahaan: obatAsli.namaPerusahaan,
                riwayat: [{
                    pemilik: 'ApotekMSP',
                    status: 'DIKIRIM_KE_APOTEK',
                    timestamp: timestamp,
                    detail: `Diterima dari PBFMSP (Pesanan: ${idPesanan}). Surat Jalan hash: ${hashSuratJalan}, Jumlah: ${jumlahDipesan}`
                }],
                idBatchAsal: obatId // Referensi ke batch asal
            };

            // Pastikan ID aset baru belum ada
            const apotekAssetExists = await this.assetExists(ctx, apotekAssetId);
            if (apotekAssetExists) {
                throw new Error(`ERROR: Aset kiriman Apotek dengan ID ${apotekAssetId} sudah ada.`);
            }

            await ctx.stub.putState(apotekAssetId, Buffer.from(JSON.stringify(apotekAsset)));
            newAssetIds.push(apotekAssetId);
        }

        return JSON.stringify({ 
            success: true, 
            message: `Transfer berhasil untuk pesanan ID ${idPesanan} ke ${namaApotek}.`,
            createdAssetIds: newAssetIds 
        });
    }
}
module.exports = PbfContract;
