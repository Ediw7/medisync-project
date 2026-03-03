'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');

const CHANNEL_NAME = 'medisyncchannel';
const CONTRACT_NAME = 'medisync';

// Fungsi helper untuk koneksi ke gateway dengan identitas dinamis (mendukung ABAC)
async function getGateway(username) {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Validasi: pastikan identitas user ada di wallet
    const identity = await wallet.get(username);
    if (!identity) {
        throw new Error(`ERROR: Identitas '${username}' tidak ditemukan di wallet. Pastikan user sudah di-enroll.`);
    }

    const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const gateway = new Gateway();
    await gateway.connect(ccp, { 
        wallet, 
        identity: username, // KUNCI ABAC: Transaksi atas nama user asli
        discovery: { enabled: true, asLocalhost: true } 
    });
    return gateway;
}

const blockchainController = {
    // Fungsi untuk query data obat
    queryObatById: async (req, res) => {
        let gateway;
        try {
            gateway = await getGateway(req.user?.username || 'admin');
            const network = await gateway.getNetwork(CHANNEL_NAME);
            const contract = network.getContract(CONTRACT_NAME);

            console.log(`Querying for obat with ID: ${req.params.id}`);
            const result = await contract.evaluateTransaction('KonsumenContract:queryObat', req.params.id);
            
            res.status(200).json(JSON.parse(result.toString()));
        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
            res.status(500).json({ error: error.message });
        } finally {
            if (gateway) gateway.disconnect();
        }
    },

    // Fungsi untuk membuat obat baru (dengan PDC & ABAC)
    createObat: async (req, res) => {
        let gateway;
        try {
            // Data Publik (argumen reguler)
            const { id, namaObat, nomorIzinEdar, tanggalProduksi, tanggalKadaluarsa, bentukSediaan, penanggungJawab, jumlah, namaPerusahaan, idProdusen } = req.body;
            // Data Privat (dikirim via Transient Map)
            const dataPrivat = req.body.dataPrivat || {};
            
            if (!id || !namaObat || !nomorIzinEdar || !tanggalKadaluarsa) {
                return res.status(400).json({ error: 'Data on-chain tidak lengkap.' });
            }

            gateway = await getGateway(req.user?.username || 'admin');
            const network = await gateway.getNetwork(CHANNEL_NAME);
            const contract = network.getContract(CONTRACT_NAME);
            
            // === Konstruksi Transient Map untuk data rahasia ===
            const transientData = {
                hargaPerUnit: Buffer.from(String(dataPrivat.hargaPerUnit || 0)),
                komposisi: Buffer.from(String(dataPrivat.komposisi || '')),
                dosis: Buffer.from(String(dataPrivat.dosis || 'N/A')),
                hashHasilUjiMutu: Buffer.from(String(dataPrivat.hashHasilUjiMutu || ''))
            };

            const transaction = contract.createTransaction('ProdusenContract:createObat');
            transaction.setTransient(transientData);

            console.log('Submitting ON-CHAIN transaction (PDC Aktif)...');
            // Hanya data publik yang dikirim sebagai argumen fungsi
            await transaction.submit(
                id, namaObat, nomorIzinEdar, tanggalProduksi, tanggalKadaluarsa,
                bentukSediaan || '', penanggungJawab || '', String(jumlah || 0),
                namaPerusahaan || '', String(idProdusen || '')
            );

            const qrCodeData = await qrcode.toDataURL(id);

            res.status(201).json({
                message: `Obat dengan ID ${id} berhasil dibuat (PDC Aktif)`,
                qrCodeDataUrl: qrCodeData
            });
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            res.status(500).json({ error: error.message });
        } finally {
            if (gateway) gateway.disconnect();
        }
    }
};

module.exports = blockchainController;
