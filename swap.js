require('dotenv').config();
const { ethers } = require('ethers');

// Load environment variables
const rpcUrl = process.env.RPC_URL;
const addressKeys = [];

for (let i = 1; i <= 100; i++) { // 1 angka mulai. 100 jumlah tx dr address
    const address = process.env[`ADDRESS_${i}`];
    const privateKey = process.env[`PRIVATE_KEY_${i}`];
    if (address && privateKey) {
        addressKeys.push({ address, privateKey });
    }
}

// Initialize provider and wallets for each address
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
const wallets = addressKeys.map(({ privateKey }) => new ethers.Wallet(privateKey, provider));

// Define the router contract
const routerAddress = '0x135a7e31b86832b6e3f73da2ecf72588fa5e00b9';
const routerAbi = [
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
    'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)'
];

const erc20Abi = [
    'function approve(address spender, uint256 amount) public returns (bool)',
    'function balanceOf(address owner) view returns (uint256)'
];

let logSequence = 1;

async function getBalance(tokenAddress, wallet) {
    if (tokenAddress === ethers.constants.AddressZero) {
        return await provider.getBalance(wallet.address);
    } else {
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
        return await tokenContract.balanceOf(wallet.address);
    }
}

async function logStatus(wallet) {
    const ARTsBalance = await getBalance('0x0000000000000000000000000000000000000000', wallet); // ART token address
    const WETHBalance = await getBalance('0xa022f656412d4f7c277b488f1220138a516970ac', wallet);
    const WBTCBalance = await getBalance('0x3d9ea1769e0ba7e9b6f5e9a506c591bd177a160d', wallet);
    console.log(`Number\t\t: ${logSequence++}\nART Balance\t: ${ethers.utils.formatUnits(ARTsBalance, 18)} ART`);
    console.log(`WBTC Balance\t: ${ethers.utils.formatUnits(WBTCBalance, 8)} WBTC`);
    console.log(`WETH Balance\t: ${ethers.utils.formatUnits(WETHBalance, 18)} WETH`);
}

async function approveToken(tokenAddress, amount, wallet) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
        const tx = await tokenContract.approve(routerAddress, amount);
        //console.log(`Approving Token for router...`);
        await tx.wait();
        console.log('Status\t\t: Approval confirmed');
    } catch (error) {
        console.error('Status\t\t: Approval failed');
        throw error;
    }
}

async function estimateSwap(routerContract, amountIn, path) {
    const amountsOut = await routerContract.getAmountsOut(amountIn, path);
    return amountsOut[amountsOut.length - 1];
}

async function swapTokens(routerContract, amountIn, path) {
    try {
        const estimatedAmountOut = await estimateSwap(routerContract, amountIn, path);
        const to = routerContract.signer.address;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        const amountOutMin = estimatedAmountOut;

        //console.log(`Processing ${ethers.utils.formatUnits(amountIn, 18)} tokens for ART...`);
        const tx = await routerContract.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
        
        console.log(`Estimated: ${ethers.utils.formatUnits(estimatedAmountOut, 18)} ART`);
        console.log(`Tx Hash: ${tx.hash.slice(0, 10)}...`);

        await tx.wait();
        console.log('Status\t\t: Transaction confirmed');
    } catch (error) {
        console.error('Status\t\t: Transaction failed');
        throw error;
    }
}

async function performSwaps() {
    for (const wallet of wallets) {
        const routerContract = new ethers.Contract(routerAddress, routerAbi, wallet);

        await logStatus(wallet);
        try {
            const WBTCPath = [
                '0x3d9ea1769e0ba7e9b6f5e9a506c591bd177a160d',
                '0x557ceb8739640b02a547a04643089accb3b88e03'
            ];
            const WBTCBalance = await getBalance('0x3d9ea1769e0ba7e9b6f5e9a506c591bd177a160d', wallet);
            const amountInWBTC = WBTCBalance;
            await approveToken('0x3d9ea1769e0ba7e9b6f5e9a506c591bd177a160d', amountInWBTC, wallet);
            await swapTokens(routerContract, amountInWBTC, WBTCPath);

            await new Promise(resolve => setTimeout(resolve, 3000));

            const WETHPath = [
                '0xa022f656412d4f7c277b488f1220138a516970ac',
                '0x557ceb8739640b02a547a04643089accb3b88e03'
            ];
            const WETHBalance = await getBalance('0xa022f656412d4f7c277b488f1220138a516970ac', wallet);
            const amountInWETH = WETHBalance;
            await approveToken('0xa022f656412d4f7c277b488f1220138a516970ac', amountInWETH, wallet);
            await swapTokens(routerContract, amountInWETH, WETHPath);

            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
            console.error('Status\t\t: Transaction failed');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const ARTsBalance = await getBalance('0x0000000000000000000000000000000000000000', wallet);
        console.log(`Total ART\t: ${ethers.utils.formatUnits(ARTsBalance, 18)} ART\n`);
    }
}

performSwaps().catch(console.error);
