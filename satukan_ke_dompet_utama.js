require('dotenv').config();
const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL;
const MAIN_ACCOUNT = process.env.MAIN_ACCOUNT;
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

async function sendAllEth() {
    for (let i = 1; i <= 100; i++) {
        const privateKey = process.env[`PRIVATE_KEY_${i}`];
        if (!privateKey) {
            console.log(`Private key for address ${i} not found.`);
            continue;
        }

        const wallet = new ethers.Wallet(privateKey, provider);
        const balance = await wallet.getBalance();
        
        if (balance.gt(ethers.utils.parseEther('0'))) {
            const gasPrice = await provider.getGasPrice();
            const gasLimit = 21000; // Gas limit for a standard ETH transfer

            const tx = {
                to: MAIN_ACCOUNT,
                value: balance.sub(gasPrice.mul(gasLimit)), // Mengirim semua ETH, dikurangi gas fee
                gasPrice: gasPrice,
                gasLimit: gasLimit
            };
 
            const transaction = await wallet.sendTransaction(tx);
            console.log(`Sending from ${wallet.address}`);
            await transaction.wait();
            console.log(`Transaction confirmed: ${transaction.hash.slice(0,10)}...`);
        } else {
            console.log(`No balance in address ${wallet.address}`);
        }
    }
}

sendAllEth().catch(console.error);

//kirim ART dari banyak wallet ke akun utama
