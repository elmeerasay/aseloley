require('dotenv').config();
const fs = require('fs');
const { ethers } = require('ethers');

const MNEMONIC = process.env.MNEMONIC;

// Generate HD wallet
const hdNode = ethers.utils.HDNode.fromMnemonic(MNEMONIC);

// Read the current content of the .env file
let envContent = fs.readFileSync('.env', 'utf8');

// Remove old address and private key entries
envContent = envContent.replace(/ADDRESS_\d+=.+/g, '');
envContent = envContent.replace(/PRIVATE_KEY_\d+=.+/g, '');

// Append new lines
envContent += "\n# List of generated addresses and private keys\n";

for (let i = 0; i < 100; i++) { // isi zid disini wallet berapa
    // Derive wallet
    const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${i}`);
    
    const address = wallet.address;
    const privateKey = wallet.privateKey;

    // Append to envContent
    envContent += `ADDRESS_${i + 1}=${address}\n`;
    envContent += `PRIVATE_KEY_${i + 1}=${privateKey}\n`;

    console.log(`Address ${i + 1}: ${address}`);
    console.log(`Private Key ${i + 1}: ${privateKey}`);
}

// Write the updated envContent back to .env
fs.writeFileSync('.env', envContent.trim() + '\n');

