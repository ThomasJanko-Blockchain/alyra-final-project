const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

// Tests du contrat SerieProjectNFT
describe("SerieProjectNFT", function () {
  // Fixture pour déployer les contrats avant chaque test
  async function deployFixture() {
    const [owner, producer, investor1, investor2] = await ethers.getSigners();

    // Déploiement du contrat SerieCoin
    const SerieCoin = await ethers.getContractFactory("SerieCoin");
    const serieCoin = await SerieCoin.deploy();

    // Déploiement du contrat SerieProjectNFT
    const SerieProjectNFT = await ethers.getContractFactory("SerieProjectNFT");
    const serieProjectNFT = await SerieProjectNFT.deploy(serieCoin.target);

    return { 
      serieCoin, 
      serieProjectNFT, 
      owner, 
      producer, 
      investor1, 
      investor2 
    };
  }

  // Variables partagées entre les tests
  let serieCoin;
  let serieProjectNFT;
  let owner;
  let producer;
  let investor1;
  let investor2;

  // Configuration avant chaque test
  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    serieCoin = fixture.serieCoin;
    serieProjectNFT = fixture.serieProjectNFT;
    owner = fixture.owner;
    producer = fixture.producer;
    investor1 = fixture.investor1;
    investor2 = fixture.investor2;
  });

  // Test du déploiement
  describe("Déploiement", function () {
    it("Devrait définir le bon propriétaire", async function () {
      expect(await serieProjectNFT.owner()).to.equal(owner.address);
    });

    it("Devrait avoir le bon nom et symbole", async function () {
      expect(await serieProjectNFT.name()).to.equal("SerieProject");
      expect(await serieProjectNFT.symbol()).to.equal("SP");
    });
  });

  // Test de la création de projet
  describe("Création de projet", function () {
    const projectData = {
      title: "Ma Série",
      description: "Une super série",
      fundingGoal: ethers.parseEther("1000"),
      duration: 365,
      copyrightURI: "ipfs://copyright",
      tokenURI: "ipfs://token"
    };

    it("Devrait créer un nouveau projet correctement", async function () {
      await expect(serieProjectNFT.connect(producer).createProject(
        projectData.title,
        projectData.description,
        projectData.fundingGoal,
        projectData.duration,
        projectData.copyrightURI,
        projectData.tokenURI
      )).to.emit(serieProjectNFT, "ProjectCreated");
    });

    it("Devrait échouer avec des paramètres invalides", async function () {
      await expect(serieProjectNFT.connect(producer).createProject(
        "",
        projectData.description,
        projectData.fundingGoal,
        projectData.duration,
        projectData.copyrightURI,
        projectData.tokenURI
      )).to.be.revertedWith("Invalid title length");
    });
  });

  // Test des investissements
  describe("Investissements", function () {
    beforeEach(async function () {
      // Créer un projet test
      await serieProjectNFT.connect(producer).createProject(
        "Test Project",
        "Description",
        ethers.parseEther("1000"),
        365,
        "ipfs://copyright",
        "ipfs://token"
      );

      // Donner des SRC aux investisseurs
      await serieCoin.mint(investor1.address, ethers.parseEther("2000"));
      await serieCoin.mint(investor2.address, ethers.parseEther("2000"));
      
      // Approuver le contrat NFT pour les dépenses
      await serieCoin.connect(investor1).approve(serieProjectNFT.target, ethers.parseEther("2000"));
      await serieCoin.connect(investor2).approve(serieProjectNFT.target, ethers.parseEther("2000"));
    });

    it("Devrait permettre l'investissement dans un projet", async function () {
      await expect(serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("500")))
        .to.emit(serieProjectNFT, "ProjectFunded");
    });

    it("Devrait mettre à jour le statut quand le financement est complet", async function () {
      await serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("1000"));
      expect(await serieProjectNFT.getProjectStatus(0)).to.equal(1); // InProduction
    });
  });

});