const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("SerieCoin", function () {
  async function deploySerieCoinFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const SerieCoin = await ethers.getContractFactory("SerieCoin");
    const serieCoin = await SerieCoin.deploy();

    return { serieCoin, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { serieCoin, owner } = await loadFixture(deploySerieCoinFixture);
      expect(await serieCoin.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      const { serieCoin } = await loadFixture(deploySerieCoinFixture);
      expect(await serieCoin.name()).to.equal("SerieCoin");
      expect(await serieCoin.symbol()).to.equal("SRC");
    });

    it("Should start with zero total supply", async function () {
      const { serieCoin } = await loadFixture(deploySerieCoinFixture);
      expect(await serieCoin.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const { serieCoin, owner, addr1 } = await loadFixture(deploySerieCoinFixture);
      const mintAmount = ethers.parseEther("100");
      
      await serieCoin.mint(addr1.address, mintAmount);
      expect(await serieCoin.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const { serieCoin, addr1 } = await loadFixture(deploySerieCoinFixture);
      const mintAmount = ethers.parseEther("100");
      
      await expect(
        serieCoin.connect(addr1).mint(addr1.address, mintAmount)
      ).to.be.revertedWithCustomError(serieCoin, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow owner to burn tokens", async function () {
      const { serieCoin, owner, addr1 } = await loadFixture(deploySerieCoinFixture);
      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("50");
      
      await serieCoin.mint(addr1.address, mintAmount);
      await serieCoin.burn(addr1.address, burnAmount);
      
      expect(await serieCoin.balanceOf(addr1.address)).to.equal(mintAmount - burnAmount);
    });

    it("Should fail if non-owner tries to burn", async function () {
      const { serieCoin, owner, addr1 } = await loadFixture(deploySerieCoinFixture);
      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("50");
      
      await serieCoin.mint(addr1.address, mintAmount);
      
      await expect(
        serieCoin.connect(addr1).burn(addr1.address, burnAmount)
      ).to.be.revertedWithCustomError(serieCoin, "OwnableUnauthorizedAccount");
    });

    it("Should fail if trying to burn more than balance", async function () {
      const { serieCoin, owner, addr1 } = await loadFixture(deploySerieCoinFixture);
      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("150");
      
      await serieCoin.mint(addr1.address, mintAmount);
      
      await expect(
        serieCoin.burn(addr1.address, burnAmount)
      ).to.be.revertedWithCustomError(serieCoin, "ERC20InsufficientBalance");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { serieCoin, owner, addr1, addr2 } = await loadFixture(deploySerieCoinFixture);
      const mintAmount = ethers.parseEther("100");
      const transferAmount = ethers.parseEther("50");
      
      await serieCoin.mint(addr1.address, mintAmount);
      await serieCoin.connect(addr1).transfer(addr2.address, transferAmount);
      
      expect(await serieCoin.balanceOf(addr1.address)).to.equal(mintAmount - transferAmount);
      expect(await serieCoin.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { serieCoin, owner, addr1, addr2 } = await loadFixture(deploySerieCoinFixture);
      const mintAmount = ethers.parseEther("100");
      const transferAmount = ethers.parseEther("150");
      
      await serieCoin.mint(addr1.address, mintAmount);
      
      await expect(
        serieCoin.connect(addr1).transfer(addr2.address, transferAmount)
      ).to.be.revertedWithCustomError(serieCoin, "ERC20InsufficientBalance");
    });
  });
});
