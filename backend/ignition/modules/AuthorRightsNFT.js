const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AuthorRightsNFTModule", (m) => {
  const authorRightsNFT = m.contract("AuthorRightsNFT");
  
  return { authorRightsNFT };
});
