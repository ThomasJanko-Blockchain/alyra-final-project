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
    await serieCoin.waitForDeployment();

    // Déploiement du contrat Staking
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(serieCoin.target);
    await staking.waitForDeployment();

    // Déploiement du contrat SerieProjectNFT
    const SerieProjectNFT = await ethers.getContractFactory("SerieProjectNFT");
    const serieProjectNFT = await SerieProjectNFT.deploy(serieCoin.target, staking.target);
    await serieProjectNFT.waitForDeployment();

    // Set SerieProjectNFT in Staking contract
    await staking.setSerieProjectNFT(serieProjectNFT.target);

    return { 
      serieCoin, 
      serieProjectNFT, 
      staking,
      owner, 
      producer, 
      investor1, 
      investor2 
    };
  }

  // Variables partagées entre les tests
  let serieCoin;
  let serieProjectNFT;
  let staking;
  let owner;
  let producer;
  let investor1;
  let investor2;

  // Configuration avant chaque test
  beforeEach(async function () {
    const fixture = await loadFixture(deployFixture);
    serieCoin = fixture.serieCoin;
    serieProjectNFT = fixture.serieProjectNFT;
    staking = fixture.staking;
    owner = fixture.owner;
    producer = fixture.producer;
    investor1 = fixture.investor1;
    investor2 = fixture.investor2;
  });

  /* ############### DEPLOYMENT ############### */
  describe("Déploiement", function () {
    it("Devrait définir le bon propriétaire", async function () {
      expect(await serieProjectNFT.owner()).to.equal(owner.address);
    });

    it("Devrait avoir le bon nom et symbole", async function () {
      expect(await serieProjectNFT.name()).to.equal("SerieProject");
      expect(await serieProjectNFT.symbol()).to.equal("SP");
    });

    it("Devrait échouer avec une adresse SerieCoin nulle", async function () {
      const SerieProjectNFT = await ethers.getContractFactory("SerieProjectNFT");
      await expect(SerieProjectNFT.deploy(ethers.ZeroAddress, ethers.ZeroAddress))
        .to.be.revertedWith("Invalid SerieCoin address");
    });
  });

  /* ############### CREATION DE PROJET ############### */
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

      const project = await serieProjectNFT.projects(0);
      expect(project.title).to.equal(projectData.title);
      expect(project.fundingGoal).to.equal(projectData.fundingGoal);
      expect(project.producer).to.equal(producer.address);
      expect(project.status).to.equal(0); // WaitingForFunds
      expect(await serieProjectNFT.projectCount()).to.equal(1);
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

      await expect(serieProjectNFT.connect(producer).createProject(
        projectData.title,
        "",
        projectData.fundingGoal,
        projectData.duration,
        projectData.copyrightURI,
        projectData.tokenURI
      )).to.be.revertedWith("Invalid description length");

      await expect(serieProjectNFT.connect(producer).createProject(
        projectData.title,
        projectData.description,
        0,
        projectData.duration,
        projectData.copyrightURI,
        projectData.tokenURI
      )).to.be.revertedWith("Funding goal must be greater than 0");

      await expect(serieProjectNFT.connect(producer).createProject(
        projectData.title,
        projectData.description,
        projectData.fundingGoal,
        0,
        projectData.copyrightURI,
        projectData.tokenURI
      )).to.be.revertedWith("Invalid duration");

      await expect(serieProjectNFT.connect(producer).createProject(
        projectData.title,
        projectData.description,
        projectData.fundingGoal,
        3651,
        projectData.copyrightURI,
        projectData.tokenURI
      )).to.be.revertedWith("Invalid duration");

      await expect(serieProjectNFT.connect(producer).createProject(
        projectData.title,
        projectData.description,
        projectData.fundingGoal,
        projectData.duration,
        "",
        projectData.tokenURI
      )).to.be.revertedWith("Copyright URI cannot be empty");

      await expect(serieProjectNFT.connect(producer).createProject(
        projectData.title,
        projectData.description,
        projectData.fundingGoal,
        projectData.duration,
        projectData.copyrightURI,
        ""
      )).to.be.revertedWith("Token URI cannot be empty");
    });
  });

  /* ############### INVESTISSEMENTS ############### */
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

      const project = await serieProjectNFT.projects(0);
      expect(project.currentFunding).to.equal(ethers.parseEther("500"));
      expect(await serieProjectNFT.projectShares(0, investor1.address)).to.be.gt(0);
    });

    it("Devrait mettre à jour le statut quand le financement est complet", async function () {
      await serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("1000"));
      expect(await serieProjectNFT.getProjectStatus(0)).to.equal(1); // InProduction
    });

    it("Devrait échouer avec un montant invalide", async function () {
      await expect(serieProjectNFT.connect(investor1).investInProject(0, 0))
        .to.be.revertedWith("Amount must be greater than 0");

      await expect(serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("1001")))
        .to.be.revertedWith("Funding goal exceeded");
    });

    it("Devrait échouer si le projet n'est pas en phase de financement", async function () {
      await serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("1000"));
      await expect(serieProjectNFT.connect(investor2).investInProject(0, ethers.parseEther("100")))
        .to.be.revertedWith("Funding goal exceeded");
    });

    it("Devrait échouer si le transfert de tokens échoue", async function () {
      await serieCoin.connect(investor1).approve(serieProjectNFT.target, 0);
      await expect(serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("500")))
        .to.be.revertedWithCustomError(serieCoin, "ERC20InsufficientAllowance");
    });
  });

  /* ############### TRANSFERT DE PARTS ############### */
  describe("Transfert de parts", function () {
    beforeEach(async function () {
      await serieProjectNFT.connect(producer).createProject(
        "Test Project",
        "Description", 
        ethers.parseEther("1000"),
        365,
        "ipfs://copyright",
        "ipfs://token"
      );

      await serieCoin.mint(investor1.address, ethers.parseEther("500"));
      await serieCoin.connect(investor1).approve(serieProjectNFT.target, ethers.parseEther("500"));
      await serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("500"));
    });

    it("Devrait permettre le transfert de parts", async function () {
      const sharesBefore = await serieProjectNFT.projectShares(0, investor1.address);
      await expect(serieProjectNFT.connect(investor1).transferShares(0, investor2.address, 1000))
        .to.emit(serieProjectNFT, "SharesTransferred");
      
      expect(await serieProjectNFT.projectShares(0, investor2.address)).to.equal(1000);
      expect(await serieProjectNFT.projectShares(0, investor1.address)).to.equal(sharesBefore - 1000n);
    });

    it("Devrait échouer avec des paramètres invalides", async function () {
      await expect(serieProjectNFT.connect(investor1).transferShares(0, ethers.ZeroAddress, 1000))
        .to.be.revertedWith("Invalid recipient");

      await expect(serieProjectNFT.connect(investor1).transferShares(0, investor1.address, 1000))
        .to.be.revertedWith("Cannot transfer shares to yourself");

      await expect(serieProjectNFT.connect(investor1).transferShares(0, investor2.address, 0))
        .to.be.revertedWith("Amount must be greater than 0");

      await expect(serieProjectNFT.connect(investor1).transferShares(0, investor2.address, 20000))
        .to.be.revertedWith("Insufficient shares");
    });

    it("Devrait échouer pour un projet inexistant", async function () {
      await expect(serieProjectNFT.connect(investor1).transferShares(99, investor2.address, 1000))
        .to.be.revertedWithCustomError(serieProjectNFT, "ProjectDoesNotExist");
    });
  });

  /* ############### COMPLETION DU PROJET ############### */
  describe("Complétion du projet", function () {
    beforeEach(async function () {
      await serieProjectNFT.connect(producer).createProject(
        "Test Project",
        "Description",
        ethers.parseEther("1000"),
        365,
        "ipfs://copyright",
        "ipfs://token"
      );

      await serieCoin.mint(investor1.address, ethers.parseEther("1000"));
      await serieCoin.connect(investor1).approve(serieProjectNFT.target, ethers.parseEther("1000"));
      await serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("1000"));
    });

    it("Devrait permettre au producteur de compléter le projet après la durée", async function () {
      await ethers.provider.send("evm_increaseTime", [366 * 24 * 60 * 60]); // 366 jours
      await expect(serieProjectNFT.connect(producer).completeProject(0))
        .to.emit(serieProjectNFT, "ProjectStatusChanged")
        .withArgs(0, 2); // Completed
    });

    it("Devrait permettre au propriétaire de forcer la complétion", async function () {
      await expect(serieProjectNFT.connect(owner).forceCompleteProject(0))
        .to.emit(serieProjectNFT, "ProjectStatusChanged")
        .withArgs(0, 2);
    });

    it("Devrait échouer si non autorisé", async function () {
      await expect(serieProjectNFT.connect(investor1).completeProject(0))
        .to.be.revertedWith("Only producer can complete project");

      await expect(serieProjectNFT.connect(investor1).forceCompleteProject(0))
        .to.be.revertedWithCustomError(serieProjectNFT, "OwnableUnauthorizedAccount");
    });

    it("Devrait échouer si la durée n'est pas atteinte", async function () {
      await expect(serieProjectNFT.connect(producer).completeProject(0))
        .to.be.revertedWith("Project duration not reached");
    });

    it("Devrait échouer si le projet n'est pas en production", async function () {
      await serieProjectNFT.connect(owner).forceCompleteProject(0);
      await expect(serieProjectNFT.connect(owner).forceCompleteProject(0))
        .to.be.revertedWith("Project not in production");
    });
  });

  /* ############### REMBOURSEMENTS ############### */
  describe("Remboursements", function () {
    beforeEach(async function () {
      await serieProjectNFT.connect(producer).createProject(
        "Test Project",
        "Description",
        ethers.parseEther("1000"),
        365,
        "ipfs://copyright",
        "ipfs://token"
      );

      await serieCoin.mint(investor1.address, ethers.parseEther("1000"));
      await serieCoin.connect(investor1).approve(serieProjectNFT.target, ethers.parseEther("1000"));
      await serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("1000"));

      await serieProjectNFT.connect(owner).forceCompleteProject(0);
    });

    it("Devrait permettre de réclamer un remboursement", async function () {
      const balanceBefore = await serieCoin.balanceOf(investor1.address);
      await expect(serieProjectNFT.connect(investor1).claimRefund(0))
        .to.emit(serieProjectNFT, "RefundClaimed");

      const balanceAfter = await serieCoin.balanceOf(investor1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
      expect(await serieProjectNFT.projectShares(0, investor1.address)).to.equal(0);
    });

    it("Devrait échouer dans des conditions invalides", async function () {
      await expect(serieProjectNFT.connect(investor2).claimRefund(0))
        .to.be.revertedWith("No shares to claim refund for");

      await serieProjectNFT.connect(investor1).claimRefund(0);
      await expect(serieProjectNFT.connect(investor1).claimRefund(0))
        .to.be.revertedWith("No shares to claim refund for");
    });

    it("Devrait échouer si le projet n'est pas terminé", async function () {
      await serieProjectNFT.connect(producer).createProject(
        "Test Project 2",
        "Description",
        ethers.parseEther("1000"),
        365,
        "ipfs://copyright",
        "ipfs://token"
      );

      await expect(serieProjectNFT.connect(investor1).claimRefund(1))
        .to.be.revertedWith("Project not completed");
    });

    it("Devrait échouer si le remboursement a déjà été réclamé", async function () {
      await serieProjectNFT.connect(investor1).claimRefund(0);
      await expect(serieProjectNFT.connect(investor1).claimRefund(0))
        .to.be.revertedWith("No shares to claim refund for");
    });
  });

  describe("Getters", function () {
    beforeEach(async function () {
      await serieProjectNFT.connect(producer).createProject(
        "Test Project",
        "Description",
        ethers.parseEther("1000"),
        365,
        "ipfs://copyright",
        "ipfs://token"
      );
    });

    it("Devrait retourner le bon URI du token", async function () {
      expect(await serieProjectNFT.tokenURI(0)).to.equal("ipfs://token");
    });

    it("Devrait retourner le bon URI des droits d'auteur", async function () {
      expect(await serieProjectNFT.getCopyrightURI(0)).to.equal("ipfs://copyright");
    });

    it("Devrait retourner le bon pourcentage de parts", async function () {
      expect(await serieProjectNFT.getSharePercentage(0, producer.address)).to.equal(100);
    });

    it("Devrait échouer pour un projet inexistant", async function () {
      await expect(serieProjectNFT.tokenURI(99))
        .to.be.revertedWithCustomError(serieProjectNFT, "ProjectDoesNotExist");

      await expect(serieProjectNFT.getCopyrightURI(99))
        .to.be.revertedWithCustomError(serieProjectNFT, "ProjectDoesNotExist");

      await expect(serieProjectNFT.getSharePercentage(99, producer.address))
        .to.be.revertedWithCustomError(serieProjectNFT, "ProjectDoesNotExist");
    });

    it("Devrait retourner le bon statut du projet", async function () {
      expect(await serieProjectNFT.getProjectStatus(0)).to.equal(0); // WaitingForFunds
      
      await serieCoin.mint(investor1.address, ethers.parseEther("1000"));
      await serieCoin.connect(investor1).approve(serieProjectNFT.target, ethers.parseEther("1000"));
      await serieProjectNFT.connect(investor1).investInProject(0, ethers.parseEther("1000"));
      expect(await serieProjectNFT.getProjectStatus(0)).to.equal(1); // InProduction
      
      await serieProjectNFT.connect(owner).forceCompleteProject(0);
      expect(await serieProjectNFT.getProjectStatus(0)).to.equal(2); // Completed
    });
  });
});