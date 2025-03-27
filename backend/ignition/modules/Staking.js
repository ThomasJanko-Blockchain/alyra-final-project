// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


module.exports = buildModule("StakingModule", (m) => {

  const serieCoin = m.contract("SerieCoin");
  const serieProject = m.contract("SerieProject", [serieCoin]);
  const staking = m.contract("Staking", [serieProject]);

  return { staking };
});
