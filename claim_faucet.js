require('dotenv').config();
const { ethers } = require('ethers');

// Setup provider
const provider = new ethers.providers.JsonRpcProvider('https://betanet-rpc1.artela.network');

// Ambil semua variabel dari environment
const getAddressesAndKeys = () => {
    const addresses = [];
    let index = 1; // dimulai dari wallet berapa
    while (process.env[`ADDRESS_${index}`] && process.env[`PRIVATE_KEY_${index}`]) {
        addresses.push({
            address: process.env[`ADDRESS_${index}`],
            privateKey: process.env[`PRIVATE_KEY_${index}`]
        });
        index++;
    }
    return addresses;
};

const addresses = getAddressesAndKeys();

// Data hex untuk transaksi
const toAddress = '0x0a28e6f9CCE474EB1DDBE7a15830012056A2DC57';
const data1 = '0xaad3ec960000000000000000000000003d9ea1769e0ba7e9b6f5e9a506c591bd177a160d00000000000000000000000000000000000000000000000000000000000f4240';
const data2 = '0xaad3ec96000000000000000000000000a022f656412d4f7c277b488f1220138a516970ac000000000000000000000000000000000000000000000000016345785d8a0000';

async function sendTransaction(wallet, data, transactionNumber) {
    const tx = {
        to: toAddress,
        data: data
    };

    const txResponse = await wallet.sendTransaction(tx);

    console.log(`Transaction ${transactionNumber} from ${wallet.address} hash: ${txResponse.hash}`);

    const receipt = await txResponse.wait();
    console.log(`Transaction ${transactionNumber} from ${wallet.address} confirmed in block: ${receipt.blockNumber}`);
}

async function sendTransactions() {
    for (const { address, privateKey } of addresses) {
        const wallet = new ethers.Wallet(privateKey, provider);

        try {
            // Kirim dua transaksi dengan data hex yang berbeda
            await sendTransaction(wallet, data1, `1 for ${address}`);
        } catch (error) {
            console.error(`Error in Transaction 1 for ${address}:`, error);
            continue; // Lanjut ke address berikutnya jika terjadi error
        }

        try {
            await sendTransaction(wallet, data2, `2 for ${address}`);
        } catch (error) {
            console.error(`Error in Transaction 2 for ${address}:`, error);
            continue; // Lanjut ke address berikutnya jika terjadi error
        }
    }
}

sendTransactions().catch(console.error);
