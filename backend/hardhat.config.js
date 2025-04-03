require("@nomicfoundation/hardhat-toolbox");
require('hardhat-docgen');
require('dotenv').config();
require ('solidity-coverage');

const { PRIVATE_KEY, RPC_URL_SEPOLIA, ETHERSCAN_API_KEY, RPC_URL_MAINNET } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  // defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: RPC_URL_SEPOLIA,
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },

  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  },
  docgen: {
    runOnCompile: true,
    outputDir: "./docs",
    pages: "files",
  },
};
