//kirim ETH to address yang sudah digenerate.
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');

// Setup provider untuk koneksi ke jaringan uji coba menggunakan RPC URL dari .env
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// Ambil private key pengirim dari .env dan buat wallet instance
const senderPrivateKey = process.env.PRIVATE_KEY;
const senderWallet = new ethers.Wallet(senderPrivateKey, provider);

// Baca .env file untuk mendapatkan semua address penerima
let envContent = fs.readFileSync('.env', 'utf8');

// Regex untuk mendapatkan semua address penerima dari .env
const addressRegex = /ADDRESS_\d+=(.+)/g;
let match;
const recipientAddresses = [];

// Extract semua address penerima dari file .env
while ((match = addressRegex.exec(envContent)) !== null) {
    recipientAddresses.push(match[1]);
}

// Fungsi untuk mengirim ETH ke banyak alamat
async function sendEtherToMany(recipients) {
    const amountToSend = ethers.utils.parseEther("0.1"); // Contoh: Kirim 0.01 ETH ke setiap alamat

    for (const [index, address] of recipients.entries()) {
        try {
            // Buat transaction object
            const tx = {
                to: address,
                value: amountToSend, // Jumlah ETH yang akan dikirim
            };

            // Kirim transaksi dari wallet pengirim
            const txResponse = await senderWallet.sendTransaction(tx);
            console.log(`Transaction ${index + 1} sent to ${address}: ${txResponse.hash}`);

            // Tunggu sampai transaksi masuk ke blok
            const receipt = await txResponse.wait();
            console.log(`Transaction ${index + 1} confirmed in block ${receipt.blockNumber}`);
        } catch (error) {
            console.error(`Failed to send transaction to ${address}:`, error);
        }
    }
}

// Jalankan fungsi untuk mengirim ETH ke semua alamat penerima
sendEtherToMany(recipientAddresses);
