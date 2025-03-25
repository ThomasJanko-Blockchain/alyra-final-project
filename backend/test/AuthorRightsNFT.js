const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("AuthorRightsNFT", function () {
  async function deployAuthorRightsNFTFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const AuthorRightsNFT = await ethers.getContractFactory("AuthorRightsNFT");
    const authorRightsNFT = await AuthorRightsNFT.deploy();

    return { authorRightsNFT, owner, addr1, addr2 };
  }

  let authorRightsNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    const fixture = await loadFixture(deployAuthorRightsNFTFixture);
    authorRightsNFT = fixture.authorRightsNFT;
    owner = fixture.owner;
    addr1 = fixture.addr1;
    addr2 = fixture.addr2;
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await authorRightsNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await authorRightsNFT.name()).to.equal("AuthorRightsNFT");
      expect(await authorRightsNFT.symbol()).to.equal("ARF");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint NFT", async function () {
      const tokenURI = "https://example.com/token/1";
      await authorRightsNFT.mintNFT(addr1.address, tokenURI);
      
      expect(await authorRightsNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await authorRightsNFT.tokenURI(1)).to.equal(tokenURI);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const tokenURI = "https://example.com/token/1";
      await expect(
        authorRightsNFT.connect(addr1).mintNFT(addr2.address, tokenURI)
      ).to.be.revertedWithCustomError(authorRightsNFT, "OwnableUnauthorizedAccount");
    });
  });
});
