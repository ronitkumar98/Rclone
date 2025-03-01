module.exports = {
    solidity: "0.8.20", // Specify the Solidity version used in your contracts
    networks: {
      hardhat: {
        chainId: 1337, // Default Hardhat network chain ID
        accounts: {
          count: 10, // Provide 10 accounts (can adjust as needed)
          initialIndex: 0,
          accountsBalance: "10000000000000000000000" // 10,000 ETH per account
        }
      }
    }
  };