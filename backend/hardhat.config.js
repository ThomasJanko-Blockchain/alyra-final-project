require("@nomicfoundation/hardhat-toolbox");
require('hardhat-docgen');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  // defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  docgen: {
    runOnCompile: true,
    outputDir: "./docs",
    pages: "files",
  },
};
