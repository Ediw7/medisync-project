'use strict';
const { Contract } = require('fabric-contract-api');

class ProdusenContract extends Contract {
    constructor() { super('ProdusenContract'); }

    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // Tambahkan parameter 'jumlah' (parameter ke-11)
    async createObat(ctx, id, namaObat, nomorIzinEdar, komposisi, dosis, tanggalProduksi, tanggalKadaluarsa, bentukSediaan, penanggungJawab, jumlah, hargaPerUnit, hashHasilUjiMutu) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') {
            throw new Error(`ERROR: Organisasi ${mspID} tidak diizinkan untuk membuat aset obat.`);
        }

        const exists = await this.assetExists(ctx, id);
        if (exists) {
            throw new Error(`ERROR: Obat dengan ID Batch ${id} sudah ada.`);
        }

        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

        // Tambahkan 'jumlah' ke objek obat
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
            hargaPerUnit: Number(hargaPerUnit) || 0, // Simpan jumlah sebagai number
            pemilikSaatIni: mspID,
            statusSaatIni: 'DIPRODUKSI',
            hashDokumen: {
                hasilUjiMutu: hashHasilUjiMutu,
                suratJalan: ''
            },
            riwayat: [{
                pemilik: mspID,
                status: 'DIPRODUKSI',
                timestamp: timestamp
            }]
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(obat)));
        return JSON.stringify(obat);
    }

    // Fungsi transferToPbf tetap sama, tapi update objek obat jika perlu
    async transferToPbf(ctx, idPesanan, hashSuratJalan) {
        const mspID = ctx.clientIdentity.getMSPID();
        if (mspID !== 'ProdusenMSP') {
            throw new Error(`ERROR: Hanya Produsen yang bisa mentransfer ke PBF.`);
        }

        const obatIds = await this.getObatIdsByPesanan(ctx, idPesanan);
        if (obatIds.length === 0) {
            throw new Error(`ERROR: Tidak ada obat terkait dengan pesanan ID ${idPesanan}.`);
        }

        for (const obatId of obatIds) {
            const assetJSON = await ctx.stub.getState(obatId);
            if (!assetJSON || assetJSON.length === 0) {
                throw new Error(`ERROR: Obat dengan ID ${obatId} tidak ditemukan.`);
            }
            const obat = JSON.parse(assetJSON.toString());

            if (obat.pemilikSaatIni !== 'ProdusenMSP') {
                throw new Error(`ERROR: Obat dengan ID ${obatId} tidak dimiliki oleh Produsen.`);
            }

            const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
            obat.pemilikSaatIni = 'PBFMSP';
            obat.statusSaatIni = 'DIKIRIM_KE_PBF';
            obat.hashDokumen.suratJalan = hashSuratJalan;
            obat.riwayat.push({
                pemilik: 'PBFMSP',
                status: 'DIKIRIM_KE_PBF',
                timestamp: timestamp,
                detail: `Surat Jalan hash: ${hashSuratJalan}`
            });

            await ctx.stub.putState(obatId, Buffer.from(JSON.stringify(obat)));
        }

        return JSON.stringify({ success: true, message: `Transfer berhasil untuk pesanan ID ${idPesanan}` });
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