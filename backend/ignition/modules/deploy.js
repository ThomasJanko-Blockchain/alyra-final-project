const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


module.exports = buildModule("MultipleContracts", (m) => {
    const serieCoin = m.contract("SerieCoin");
    const serieProject = m.contract("SerieProjectNFT", [serieCoin]);
    const staking = m.contract("Staking", [serieProject]);

  return { serieCoin, serieProject, staking };
});