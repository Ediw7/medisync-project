'use strict';
const { Contract } = require('fabric-contract-api');

class PbfContract extends Contract {
    constructor() { super('PbfContract'); }

    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // --- FUNGSI terimaBarang (Sudah Benar, tidak diubah) ---
    async terimaBarang(ctx, batchId, hashBuktiFoto, namaPbf) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'PBFMSP') {
            throw new Error(`ERROR: Hanya PBF yang bisa menerima barang.`);
        }
        
        if (!namaPbf || namaPbf.trim() === '') {
            throw new Error('ERROR: Nama PBF (nama_resmi) wajib disertakan saat menerima barang.');
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
        
        const riwayatBaru = {
            pemilik: 'PBFMSP',
            status: 'DITERIMA_PBF',
            timestamp: timestamp,
            detail: `Barang diterima oleh PBF.`,
            penerima: namaPbf,
            hashBukti: hashBuktiFoto
        };
        
        obat.riwayat.push(riwayatBaru);

        await ctx.stub.putState(batchId, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }
    // --- AKHIR FUNGSI terimaBarang ---


    // --- FUNGSI transferToApotek (DIPERBAIKI) ---
    async transferToApotek(ctx, idPesanan, hashSuratJalan, namaApotek, obatIdsJson, jumlahPesananJson) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'PBFMSP') {
            throw new Error(`ERROR: Hanya PBF yang bisa mentransfer ke Apotek.`);
        }

        const obatIds = JSON.parse(obatIdsJson);
        const jumlahPesananList = JSON.parse(jumlahPesananJson);
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

           const isReadyToSend = obatAsli.statusSaatIni === 'DITERIMA_PBF' || obatAsli.statusSaatIni === 'STOK_SEBAGIAN_DIKIRIM';
            if (!isReadyToSend) {
                throw new Error(`ERROR: Obat dengan ID ${obatId} tidak dalam status siap dikirim (Status saat ini: ${obatAsli.statusSaatIni}).`);
            }

            const pesananItem = jumlahPesananList.find(item => item.obatId === obatId);
            const jumlahDipesan = pesananItem ? Number(pesananItem.jumlah) : 0;
            if (jumlahDipesan <= 0) {
                throw new Error(`ERROR: Jumlah pesanan untuk obat ${obatId} tidak valid.`);
            }
            if (obatAsli.jumlah < jumlahDipesan) {
                throw new Error(`ERROR: Stok obat ${obatId} (${obatAsli.jumlah}) tidak cukup untuk pesanan ${jumlahDipesan}.`);
            }

            // 1. Update Aset Asli (PBF)
            obatAsli.jumlah -= jumlahDipesan;
            
            const riwayatPbfBaru = {
                pemilik: 'PBFMSP',
                status: 'DIKIRIM_KE_APOTEK',
                timestamp: timestamp,
                detail: `Transfer ke ${namaApotek} (Pesanan: ${idPesanan}). Jumlah: ${jumlahDipesan}. Sisa stok: ${obatAsli.jumlah}.`
            };
            obatAsli.riwayat.push(riwayatPbfBaru); // Tambahkan riwayat ke aset PBF

             if (obatAsli.jumlah > 0) {
                obatAsli.statusSaatIni = 'STOK_SEBAGIAN_DIKIRIM';
            } else {
                obatAsli.statusSaatIni = 'STOK_HABIS';
            }
            
            await ctx.stub.putState(obatAsli.id, Buffer.from(JSON.stringify(obatAsli)));

            // 2. Buat Aset Baru (Apotek)
            const apotekAssetId = `${obatId}-${idPesanan}`;
            
            // --- PERBAIKAN LOGIKA RIWAYAT ---
            // Buat event riwayat baru untuk aset Apotek
            const riwayatApotekBaru = {
                pemilik: 'ApotekMSP',
                status: 'DIKIRIM_KE_APOTEK',
                timestamp: timestamp,
                detail: `Diterima dari PBFMSP (Pesanan: ${idPesanan}). Surat Jalan hash: ${hashSuratJalan}, Jumlah: ${jumlahDipesan}`
            };
            // --- AKHIR PERBAIKAN ---

            const apotekAsset = {
                docType: 'obat',
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
                jumlah: Number(jumlahDipesan),
                pemilikSaatIni: 'ApotekMSP',
                statusSaatIni: 'DIKIRIM_KE_APOTEK', 
                hashDokumen: {
                    hasilUjiMutu: obatAsli.hashDokumen.hasilUjiMutu,
                    suratJalan: hashSuratJalan
                },
                namaPerusahaan: obatAsli.namaPerusahaan,
                
                // --- PERBAIKAN LOGIKA RIWAYAT ---
                // Salin riwayat dari aset PBF, lalu tambahkan riwayat baru Apotek
                riwayat: [ ...obatAsli.riwayat, riwayatApotekBaru ],
                idProdusen: obatAsli.idProdusen, 
                idPbf: obatAsli.idPbf,
                // --- AKHIR PERBAIKAN ---
                
                idBatchAsal: obatId
            };

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