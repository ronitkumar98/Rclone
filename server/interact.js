const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
];

async function callContractFunction(address, functionName, args, accountIndex, isView) {
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  const signer = new ethers.Wallet(PRIVATE_KEYS[accountIndex || 0], provider);
  const artifactPath = path.join(__dirname, '../artifacts', 'SimpleContract.sol.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const contract = new ethers.Contract(address, artifact.SimpleContract.abi, signer);

  if (isView) {
    const result = await contract[functionName](...args);
    // Convert BigNumber to string
    return { result: ethers.BigNumber.isBigNumber(result) ? result.toString() : result };
  } else {
    const tx = await contract[functionName](...args);
    await tx.wait();
    return { txHash: tx.hash };
  }
}

module.exports = { callContractFunction };