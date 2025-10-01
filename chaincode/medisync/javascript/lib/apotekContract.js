'use strict';
const { Contract } = require('fabric-contract-api');

class ApotekContract extends Contract {
    constructor() {
        super('ApotekContract');
    }
    
    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    async terimaBarang(ctx, id, hashBuktiPenerimaan) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ApotekMSP') {
            throw new Error(`ERROR: Hanya Apotek yang dapat menerima barang.`);
        }

        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Aset obat dengan ID ${id} tidak ditemukan.`);
        }

        const obat = JSON.parse(assetJSON.toString());

        // Verifikasi bahwa statusnya adalah DIKIRIM_KE_APOTEK
        if (obat.statusSaatIni !== 'DIKIRIM_KE_APOTEK') {
            throw new Error(`ERROR: Aset ini tidak sedang dalam pengiriman ke Apotek.`);
        }
        
        // Kepemilikan sudah di ApotekMSP saat ditransfer, jadi kita hanya update status
        if (obat.pemilikSaatIni !== 'ApotekMSP') {
             throw new Error(`ERROR: Aset ini tidak dimiliki oleh Apotek MSP.`);
        }

        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.statusSaatIni = 'DITERIMA_APOTEK';
        obat.riwayat.push({
            pemilik: 'ApotekMSP',
            status: 'DITERIMA_APOTEK',
            timestamp: timestamp,
            detail: `Diterima oleh Apotek dengan bukti hash: ${hashBuktiPenerimaan}`
        });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        console.log(`Aset ${id} berhasil diterima oleh Apotek.`);
        return JSON.stringify(obat);
    }

    async jualKeKonsumen(ctx, id, infoKonsumen, jumlahJual) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ApotekMSP') {
            throw new Error(`ERROR: Hanya Apotek yang bisa menjual ke konsumen.`);
        }
        
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        const obat = JSON.parse(assetJSON.toString());

        if (obat.pemilikSaatIni !== 'ApotekMSP') {
            throw new Error(`ERROR: Obat ini tidak dimiliki oleh Apotek.`);
        }

        const jumlahJualInt = parseInt(jumlahJual, 10);
        if (isNaN(jumlahJualInt) || jumlahJualInt <= 0) {
            throw new Error('ERROR: Jumlah yang dijual harus angka positif.');
        }
        if (jumlahJualInt > obat.jumlah) {
             throw new Error(`ERROR: Stok tidak mencukupi. Stok saat ini: ${obat.jumlah}, permintaan: ${jumlahJualInt}.`);
        }
        
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.jumlah -= jumlahJualInt;

        const statusDetail = `TERJUAL_SEBAGIAN`;
        if (obat.jumlah === 0) {
            obat.statusSaatIni = 'STOK_HABIS';
        }

        obat.riwayat.push({
            pemilik: 'KONSUMEN',
            status: statusDetail,
            timestamp: timestamp,
            detail: `${jumlahJualInt} unit terjual ke ${infoKonsumen}. Sisa stok: ${obat.jumlah}`
        });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        console.log(`${jumlahJualInt} unit aset ${id} berhasil dijual ke konsumen.`);
        return JSON.stringify(obat);
    }

    async queryStokApotek(ctx) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ApotekMSP') {
            throw new Error(`ERROR: Hanya Apotek yang dapat melihat stoknya.`);
        }

        const queryString = {
            selector: {
                docType: 'obat',
                pemilikSaatIni: 'ApotekMSP',
                jumlah: { $gt: 0 } 
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allResults = [];
        let result = await iterator.next();
        while (!result.done) {
            const res = result.value.value.toString('utf8');
            allResults.push(JSON.parse(res));
            result = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }
}

module.exports = ApotekContract;