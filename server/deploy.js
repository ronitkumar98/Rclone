const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Hardhat account 0
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Hardhat account 1
  // Add more as needed
];

async function deployContract(source, contract, accountIndex) {
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  const signer = new ethers.Wallet(PRIVATE_KEYS[accountIndex || 0], provider);
  const artifactPath = path.join(__dirname, '../artifacts', `${source}.json`);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const contractInfo = artifact[contract];
  const factory = new ethers.ContractFactory(contractInfo.abi, contractInfo.evm.bytecode.object, signer);
  const deployedContract = await factory.deploy();
  await deployedContract.deployed();
  return deployedContract.address;
}

module.exports = { deployContract };