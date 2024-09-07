require('dotenv').config();
const { ethers } = require('ethers');

const RPC_URL = process.env.RPC_URL;
const MAIN_ACCOUNT = process.env.MAIN_ACCOUNT;
const TOKEN_CONTRACT_ADDRESS_USDT = '0x6cddd437ced8a9af4d53ee51b1645bbd08f9b702'; // USDT token contract address
const TOKEN_CONTRACT_ADDRESS_WETH = '0xA022F656412d4f7c277B488f1220138a516970ac'; // WETH token contract address
const TOKEN_CONTRACT_ADDRESS_WBTC = '0x3d9eA1769E0bA7e9B6F5e9a506C591Bd177A160d'; // WBTC token contract address
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// ABI for ERC20 tokens, includes transfer and balanceOf methods
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address account) public view returns (uint256)"
];

// General function to handle token transfers with customizable decimals
async function sendToken(wallet, tokenAddress, tokenName, decimals) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        const balance = await tokenContract.balanceOf(wallet.address);

        if (balance.gt(ethers.constants.Zero)) {
            const gasPrice = await provider.getGasPrice();

            console.log(`From\t: ${wallet.address}`);
            console.log(`Send\t: ${ethers.utils.formatUnits(balance, decimals)} ${tokenName}`);

            const transaction = await tokenContract.transfer(MAIN_ACCOUNT, balance);
            await transaction.wait();

            console.log(`Tx hash\t: ${transaction.hash.slice(0,10)}...`);
        } else {
            console.log(`From\t: ${wallet.address}`);
            console.log(`Status\t: No ${tokenName} Balance`);
        }
    } catch (error) {
        console.error(`Error sending ${tokenName} from ${wallet.address}:`);
        throw error; // Rethrow error to be handled by the main function
    }
}

async function sendAll() {
    const privateKeys = Object.keys(process.env).filter(key => key.startsWith('PRIVATE_KEY_'));

    for (let i = 0; i < privateKeys.length; i++) {
        const privateKey = process.env[privateKeys[i]];
        if (!privateKey) {
            console.log(`Private key for address ${i + 1} not found.`);
            continue;
        }

        const wallet = new ethers.Wallet(privateKey, provider);

        try {
            // Send USDT (18 decimals), WETH (18 decimals), and WBTC (8 decimals)
            await sendToken(wallet, TOKEN_CONTRACT_ADDRESS_USDT, 'USDT', 18);
            await sendToken(wallet, TOKEN_CONTRACT_ADDRESS_WETH, 'WETH', 18);
            await sendToken(wallet, TOKEN_CONTRACT_ADDRESS_WBTC, 'WBTC', 8);

            // After sending tokens, send ETH if balance is available
            const balance = await wallet.getBalance();
            
            if (balance.gt(ethers.utils.parseEther('0'))) {
                const gasPrice = await provider.getGasPrice();
                const gasLimit = 21000; // Gas limit for standard ETH transfer

                const tx = {
                    to: MAIN_ACCOUNT,
                    value: balance.sub(gasPrice.mul(gasLimit)), // Send all ETH minus gas fee
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                };

                console.log(`From\t: ${wallet.address}`);
                console.log(`Send\t: ${ethers.utils.formatEther(tx.value)} ETH`);

                const transaction = await wallet.sendTransaction(tx);
                console.log(`Tx hash\t: ${transaction.hash.slice(0,10)}...`);
                await transaction.wait();
            } else {
                console.log(`From\t: ${wallet.address}`);
                console.log(`Status\t: No ETH Balance`);
            }
        } catch (error) {
            console.error(`Error processing wallet ${wallet.address}:`);
            console.log(`Retrying...`);
            try {
                // Retry token transfer
                await sendToken(wallet, TOKEN_CONTRACT_ADDRESS_USDT, 'USDT', 18);
                await sendToken(wallet, TOKEN_CONTRACT_ADDRESS_WETH, 'WETH', 18);
                await sendToken(wallet, TOKEN_CONTRACT_ADDRESS_WBTC, 'WBTC', 8);

                const balance = await wallet.getBalance();
                if (balance.gt(ethers.utils.parseEther('0'))) {
                    const gasPrice = await provider.getGasPrice();
                    const gasLimit = 21000; // Gas limit for standard ETH transfer

                    const tx = {
                        to: MAIN_ACCOUNT,
                        value: balance.sub(gasPrice.mul(gasLimit)), // Send all ETH minus gas fee
                        gasPrice: gasPrice,
                        gasLimit: gasLimit
                    };

                    console.log(`Retry sending ${ethers.utils.formatEther(tx.value)} ETH`);
                    const transaction = await wallet.sendTransaction(tx);
                    console.log(`Tx hash\t: ${transaction.hash.slice(0,10)}...`);
                    await transaction.wait();
                } else {
                    console.log(`From\t: ${wallet.address}`);
                    console.log(`Status\t: No ETH Balance`);
                }
            } catch (retryError) {
                console.error(`Retry failed for wallet ${wallet.address}:`, retryError.message);
            }
        }
    }
}

sendAll().catch(console.error);
