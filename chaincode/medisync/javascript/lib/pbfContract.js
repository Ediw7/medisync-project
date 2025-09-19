'use strict';
const { Contract } = require('fabric-contract-api');

class PbfContract extends Contract {
    constructor() { super('PbfContract'); }
    
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

    async transferToApotek(ctx, id, hashSuratJalanBaru) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'PBFMSP') {
            throw new Error(`ERROR: Hanya PBF yang bisa mentransfer ke Apotek.`);
        }

        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        const obat = JSON.parse(assetJSON.toString());

        if (obat.pemilikSaatIni !== 'PBFMSP') {
            throw new Error(`ERROR: Obat ini tidak dimiliki oleh PBF.`);
        }
        
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        obat.pemilikSaatIni = 'ApotekMSP';
        obat.statusSaatIni = 'DIKIRIM_KE_APOTEK';
        obat.hashDokumen.suratJalan = hashSuratJalanBaru;
        obat.riwayat.push({
            pemilik: 'ApotekMSP',
            status: 'DIKIRIM_KE_APOTEK',
            timestamp: timestamp,
            detail: `Surat Jalan hash: ${hashSuratJalanBaru}`
        });

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }
}
module.exports = PbfContract;
