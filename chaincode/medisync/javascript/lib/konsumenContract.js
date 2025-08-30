'use strict';
const { Contract } = require('fabric-contract-api');

class KonsumenContract extends Contract {
    constructor() { super('KonsumenContract'); }

    async queryObat(ctx, id) {
        const obatAsBytes = await ctx.stub.getState(id);
        if (!obatAsBytes || obatAsBytes.length === 0) {
            throw new Error(`ERROR: Obat dengan ID ${id} tidak ditemukan.`);
        }
        return obatAsBytes.toString();
    }

    async queryRiwayatObat(ctx, id) {
        const iterator = await ctx.stub.getHistoryForKey(id);
        const allResults = [];
        
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                const txTimestamp = res.value.timestamp;
                let timestampStr = "N/A";
                
                if (txTimestamp && txTimestamp.seconds) {
                    const seconds = Number(txTimestamp.seconds);
                    const nanos = Number(txTimestamp.nanos);
                    timestampStr = new Date(seconds * 1000 + nanos / 1000000).toISOString();
                }

                const obj = {
                    TxId: res.value.tx_id,
                    Timestamp: timestampStr,
                    Value: JSON.parse(res.value.value.toString('utf8')),
                    IsDelete: res.value.is_delete,
                };
                allResults.push(obj);
            }
            res = await iterator.next();
        }
        await iterator.close();
        return JSON.stringify(allResults);
    }

    async queryAllObat(ctx) {
        const queryString = {
            selector: {
                docType: 'obat'
            }
        };
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        
        const allResults = [];
        let result = await iterator.next();
        while (!result.done) {
            if (result.value && result.value.value.toString()) {
                const jsonRes = {};
                console.log(result.value.value.toString('utf8'));
                jsonRes.Key = result.value.key;
                try {
                    jsonRes.Record = JSON.parse(result.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = result.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            result = await iterator.next();
        }
        iterator.close();
        return JSON.stringify(allResults);
    }

}
module.exports = KonsumenContract;
