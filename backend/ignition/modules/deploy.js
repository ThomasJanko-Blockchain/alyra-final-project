const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MultipleContracts", (m) => {
  // First deploy SerieCoin
  const serieCoin = m.contract("SerieCoin");

  // Then deploy Staking with SerieCoin address
  const staking = m.contract("Staking", [
    serieCoin,    // SerieCoin address
  ]);

  // Then deploy SerieProjectNFT with both addresses
  const serieProjectNFT = m.contract("SerieProjectNFT", [
    serieCoin,    // SerieCoin address
    staking,      // Staking address
  ]);

  // Set SerieProjectNFT in Staking contract
  m.call(staking, "setSerieProjectNFT", [
    serieProjectNFT,
  ]);

  return { 
    serieCoin, 
    serieProjectNFT,
    staking 
  };
});
