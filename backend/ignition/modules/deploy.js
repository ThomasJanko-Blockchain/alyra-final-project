import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultipleContracts", (m) => {
    const serieCoin = m.contract("SerieCoin");
    const serieProject = m.contract("SerieProjectNFT", [serieCoin]);
    const staking = m.contract("Staking", [serieProject]);

  return { serieCoin, serieProject, staking };
});