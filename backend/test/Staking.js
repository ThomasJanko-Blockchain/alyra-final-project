const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { expect } = require("chai");
  const { ethers } = require("hardhat");

  
  describe("Staking", function () {
    // Fixture pour déployer les contrats nécessaires aux tests
    async function deployStakingFixture() {
        const [owner, addr1, addr2] = await ethers.getSigners();

        // Déploiement de SerieCoin
        const SerieCoin = await ethers.getContractFactory("SerieCoin");
        const serieCoin = await SerieCoin.deploy();
        await serieCoin.waitForDeployment();

        // Déploiement du contrat de Staking
        const Staking = await ethers.getContractFactory("Staking");
        const staking = await Staking.deploy(serieCoin.target);
        await staking.waitForDeployment();

        // Déploiement de SerieProjectNFT
        const SerieProjectNFT = await ethers.getContractFactory("SerieProjectNFT");
        const serieProject = await SerieProjectNFT.deploy(serieCoin.target, staking.target);
        await serieProject.waitForDeployment();

        // Configuration de l'adresse SerieProjectNFT dans le contrat Staking
        await staking.setSerieProjectNFT(serieProject.target);

        // Mint des jetons pour les adresses de test
        await serieCoin.mint(addr1.address, ethers.parseEther("1000"));
        await serieCoin.mint(addr2.address, ethers.parseEther("1000"));
        await serieCoin.mint(staking.target, ethers.parseEther("1000")); // Mint des jetons pour le contrat de staking

        return { staking, serieCoin, serieProject, owner, addr1, addr2 };
    }

    describe("Deployment", function () {
        // Vérifie que le propriétaire est correctement défini
        it("Should set the right owner", async function () {
            const { staking, owner } = await loadFixture(deployStakingFixture);
            expect(await staking.owner()).to.equal(owner.address);
        });

        // Vérifie que l'adresse SerieCoin est correctement définie
        it("Should set the right SerieCoin address", async function () {
            const { staking, serieCoin } = await loadFixture(deployStakingFixture);
            expect(await staking.serieCoin()).to.equal(serieCoin.target);
        });

        // Vérifie qu'on ne peut pas définir SerieProjectNFT deux fois
        it("Should not allow setting SerieProjectNFT twice", async function () {
            const { staking, serieProject } = await loadFixture(deployStakingFixture);
            await expect(staking.setSerieProjectNFT(serieProject.target))
                .to.be.revertedWith("SerieProjectNFT already set");
        });

        // Vérifie qu'on ne peut pas définir l'adresse zéro comme SerieProjectNFT
        it("Should not allow setting zero address as SerieProjectNFT", async function () {
            const { staking } = await loadFixture(deployStakingFixture);
            await expect(staking.setSerieProjectNFT(ethers.ZeroAddress))
                .to.be.revertedWith("Invalid SerieProjectNFT address");
        });
    });

    describe("Staking", function () {
        // Vérifie la création d'un stake lors de l'investissement dans un projet
        it("Should create a stake when investing in a project", async function () {
            const { staking, serieProject, serieCoin, addr1 } = await loadFixture(deployStakingFixture);

            // Création d'un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            // Approbation des jetons
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("50"));

            // Investissement dans le projet
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("50"));

            // Vérification de la création du stake
            const stakes = await staking.getUserStakes(addr1.address);
            expect(stakes.length).to.equal(1);
            expect(stakes[0].amount).to.equal(ethers.parseEther("50"));
            expect(stakes[0].projectId).to.equal(0);
            expect(stakes[0].isActive).to.equal(true);
            expect(stakes[0].claimed).to.equal(false);
        });

        // Vérifie qu'on ne peut pas investir un montant nul
        it("Should not allow zero amount investment", async function () {
            const { serieProject, serieCoin, addr1 } = await loadFixture(deployStakingFixture);

            // Création d'un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            // Approbation des jetons
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("50"));

            // Tentative d'investissement d'un montant nul
            await expect(serieProject.connect(addr1).investInProject(0, 0))
                .to.be.revertedWith("Amount must be greater than 0");
        });

        // Vérifie la création de plusieurs stakes pour différents projets
        it("Should create multiple stakes for different projects", async function () {
            const { staking, serieProject, serieCoin, addr1 } = await loadFixture(deployStakingFixture);

            // Création de deux projets
            await serieProject.createProject(
                "Test Project 1",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test1",
                "ipfs://test1"
            );

            await serieProject.createProject(
                "Test Project 2",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test2",
                "ipfs://test2"
            );

            // Approbation des jetons pour les deux projets
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));

            // Investissement dans les deux projets
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("50"));
            await serieProject.connect(addr1).investInProject(1, ethers.parseEther("50"));

            // Vérification de la création des stakes
            const stakes = await staking.getUserStakes(addr1.address);
            expect(stakes.length).to.equal(2);
            expect(stakes[0].projectId).to.equal(0);
            expect(stakes[1].projectId).to.equal(1);
            expect(stakes[0].isActive).to.equal(true);
            expect(stakes[1].isActive).to.equal(true);
        });

        // Vérifie le calcul correct des récompenses basé sur le temps
        it("Should calculate rewards correctly based on time", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création et investissement dans un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Complétion du projet (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Avance rapide d'un an
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            // Calcul des récompenses
            const rewards = await staking.calculateRewards(addr1.address, 0);
            const expectedRewards = ethers.parseEther("100") * 5n / 100n; // 5% de 100
            expect(rewards).to.equal(expectedRewards);
        });

        // Vérifie qu'on ne peut pas réclamer les récompenses deux fois
        it("Should not allow claiming rewards twice", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création et investissement dans un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Complétion du projet (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Avance rapide d'un an
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            // Première réclamation des récompenses
            await staking.connect(addr1).claimRewards(0);

            // Tentative de réclamation des récompenses une seconde fois
            await expect(staking.connect(addr1).claimRewards(0))
                .to.be.revertedWith("Rewards already claimed");
        });

        // Vérifie la gestion correcte de plusieurs stakes et réclamations
        it("Should handle multiple stakes and claims correctly", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création de deux projets
            await serieProject.createProject(
                "Test Project 1",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test1",
                "ipfs://test1"
            );

            await serieProject.createProject(
                "Test Project 2",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test2",
                "ipfs://test2"
            );

            // Approbation des jetons pour les deux projets
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("200"));

            // Investissement dans les deux projets
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(1, ethers.parseEther("100"));

            // Complétion des deux projets (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);
            await serieProject.connect(owner).forceCompleteProject(1);

            // Avance rapide d'un an
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            // Récupération du solde initial
            const initialBalance = await serieCoin.balanceOf(addr1.address);

            // Réclamation des récompenses pour le premier projet
            await staking.connect(addr1).claimRewards(0);

            // Unstake et réclamation pour le second projet
            await staking.connect(addr1).unstakeAndClaim(1);

            // Vérification du solde final
            const finalBalance = await serieCoin.balanceOf(addr1.address);
            expect(finalBalance).to.be.gt(initialBalance);

            // Vérification des statuts des stakes
            const stakes = await staking.getUserStakes(addr1.address);
            expect(stakes[0].claimed).to.equal(true);
            expect(stakes[0].isActive).to.equal(true);
            expect(stakes[1].claimed).to.equal(true);
            expect(stakes[1].isActive).to.equal(false);
        });

        // Vérifie qu'on ne peut pas unstake avec un index invalide
        it("Should not allow unstaking with invalid stake index", async function () {
            const { staking, addr1 } = await loadFixture(deployStakingFixture);
            await expect(staking.connect(addr1).unstakeAndClaim(999))
                .to.be.revertedWith("Invalid stake index");
        });

        // Vérifie qu'on ne peut pas réclamer les récompenses avec un index invalide
        it("Should not allow claiming rewards with invalid stake index", async function () {
            const { staking, serieProject, serieCoin, addr1 } = await loadFixture(deployStakingFixture);

            // Création d'un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            // Tentative de réclamation des récompenses sans stake
            await expect(staking.connect(addr1).claimRewards(0))
                .to.be.revertedWith("Invalid stake index");
        });

        // Vérifie qu'on ne peut pas calculer les récompenses pour un stake inactif
        it("Should not allow calculating rewards for inactive stake", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création et investissement dans un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Complétion du projet (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Unstake d'abord
            await staking.connect(addr1).unstakeAndClaim(0);

            // Tentative de calcul des récompenses
            await expect(staking.calculateRewards(addr1.address, 0))
                .to.be.revertedWith("Stake is not active");
        });

        // Vérifie le montant total staké correct pour un projet
        it("Should return correct project total staked amount", async function () {
            const { staking, serieProject, serieCoin, addr1, addr2 } = await loadFixture(deployStakingFixture);

            // Création d'un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("200"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            // Approbation des jetons pour les deux utilisateurs
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieCoin.connect(addr2).approve(serieProject.target, ethers.parseEther("100"));

            // Les deux utilisateurs investissent
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));
            await serieProject.connect(addr2).investInProject(0, ethers.parseEther("100"));

            // Vérification du montant total staké
            const totalStaked = await staking.getProjectTotalStaked(0);
            expect(totalStaked).to.equal(ethers.parseEther("200"));
        });

        // Vérifie le cas limite des récompenses nulles
        it("Should handle edge case of zero rewards", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création et investissement dans un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Complétion immédiate du projet (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Calcul des récompenses (devrait être 0 car aucun temps n'est passé)
            const rewards = await staking.calculateRewards(addr1.address, 0);
            expect(rewards).to.equal(0);
        });

        // Vérifie la recherche correcte de l'index du stake pour un projet
        it("Should find correct stake index for project", async function () {
            const { staking, serieProject, serieCoin, addr1 } = await loadFixture(deployStakingFixture);

            // Création de deux projets
            await serieProject.createProject(
                "Test Project 1",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test1",
                "ipfs://test1"
            );

            await serieProject.createProject(
                "Test Project 2",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test2",
                "ipfs://test2"
            );

            // Approbation des jetons pour les deux projets
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("200"));

            // Investissement dans les deux projets
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(1, ethers.parseEther("100"));

            // Recherche de l'index du stake pour le premier projet
            const stakeIndex = await staking.getStakeIndexForProject(0, addr1.address);
            expect(stakeIndex).to.equal(0);

            // Recherche de l'index du stake pour le second projet
            const stakeIndex2 = await staking.getStakeIndexForProject(1, addr1.address);
            expect(stakeIndex2).to.equal(1);

            // Recherche de l'index du stake pour un projet inexistant
            const stakeIndex3 = await staking.getStakeIndexForProject(2, addr1.address);
            expect(stakeIndex3).to.equal(ethers.MaxUint256);
        });

       

        // Vérifie la gestion de plusieurs réclamations de récompenses pour différents stakes
        it("Should handle multiple rewards claims for different stakes", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création de deux projets
            await serieProject.createProject(
                "Test Project 1",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test1",
                "ipfs://test1"
            );

            await serieProject.createProject(
                "Test Project 2",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test2",
                "ipfs://test2"
            );

            // Approbation des jetons pour les deux projets
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("200"));

            // Investissement dans les deux projets
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(1, ethers.parseEther("100"));

            // Complétion des deux projets (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);
            await serieProject.connect(owner).forceCompleteProject(1);

            // Avance rapide d'un an
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            // Récupération du solde initial
            const initialBalance = await serieCoin.balanceOf(addr1.address);

            // Réclamation des récompenses pour les deux projets
            await staking.connect(addr1).claimRewards(0);
            await staking.connect(addr1).claimRewards(1);

            // Vérification du solde final
            const finalBalance = await serieCoin.balanceOf(addr1.address);
            const expectedRewards = ethers.parseEther("100") * 5n / 100n * 2n; // 5% de 100 pour chaque projet
            expect(finalBalance - initialBalance).to.equal(expectedRewards);

            // Vérification des statuts des stakes
            const stakes = await staking.getUserStakes(addr1.address);
            expect(stakes[0].claimed).to.equal(true);
            expect(stakes[0].isActive).to.equal(true);
            expect(stakes[1].claimed).to.equal(true);
            expect(stakes[1].isActive).to.equal(true);
        });

        // Vérifie l'unstaking sans récompenses
        it("Should handle unstaking without rewards", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création et investissement dans un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Complétion du projet (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Récupération du solde initial
            const initialBalance = await serieCoin.balanceOf(addr1.address);

            // Unstake immédiat (pas de récompenses)
            await staking.connect(addr1).unstakeAndClaim(0);

            // Vérification du solde final
            const finalBalance = await serieCoin.balanceOf(addr1.address);
            expect(finalBalance - initialBalance).to.equal(ethers.parseEther("100")); // Seul le principal est retourné

            // Vérification du statut du stake
            const stakes = await staking.getUserStakes(addr1.address);
            expect(stakes[0].claimed).to.equal(true);
            expect(stakes[0].isActive).to.equal(false);
        });

        // Vérifie le montant total staké du projet après unstaking
        it("Should handle project total staked amount after unstaking", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création d'un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            // Approbation des jetons
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));

            // Investissement dans le projet
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Vérification du montant total staké initial
            let totalStaked = await staking.getProjectTotalStaked(0);
            expect(totalStaked).to.equal(ethers.parseEther("100"));

            // Complétion du projet (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Unstake
            await staking.connect(addr1).unstakeAndClaim(0);

            // Vérification du montant total staké final
            totalStaked = await staking.getProjectTotalStaked(0);
            expect(totalStaked).to.equal(0);
        });

        // Vérifie la gestion de plusieurs investissements dans le même projet
        it("Should handle multiple investments in same project", async function () {
            const { staking, serieProject, serieCoin, addr1 } = await loadFixture(deployStakingFixture);

            // Création d'un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("200"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            // Approbation des jetons
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("200"));

            // Investissement dans le projet deux fois
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Vérification de la création des stakes
            const stakes = await staking.getUserStakes(addr1.address);
            expect(stakes.length).to.equal(2);
            expect(stakes[0].amount).to.equal(ethers.parseEther("100"));
            expect(stakes[1].amount).to.equal(ethers.parseEther("100"));
            expect(stakes[0].projectId).to.equal(0);
            expect(stakes[1].projectId).to.equal(0);
            expect(stakes[0].isActive).to.equal(true);
            expect(stakes[1].isActive).to.equal(true);

            // Vérification du montant total staké
            const totalStaked = await staking.getProjectTotalStaked(0);
            expect(totalStaked).to.equal(ethers.parseEther("200"));
        });

        // Vérifie getStakeIndexForProject sans stakes
        it("Should handle getStakeIndexForProject with no stakes", async function () {
            const { staking, addr1 } = await loadFixture(deployStakingFixture);
            const stakeIndex = await staking.getStakeIndexForProject(0, addr1.address);
            expect(stakeIndex).to.equal(ethers.MaxUint256);
        });

        // Vérifie getStakeIndexForProject avec un stake inactif
        it("Should handle getStakeIndexForProject with inactive stake", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Création et investissement dans un projet
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Complétion du projet (par le propriétaire)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Unstake
            await staking.connect(addr1).unstakeAndClaim(0);

            // Tentative de recherche de l'index du stake
            const stakeIndex = await staking.getStakeIndexForProject(0, addr1.address);
            expect(stakeIndex).to.equal(ethers.MaxUint256);
        });

        // Vérifie getStakeIndexForProject avec plusieurs stakes
        it("Should handle getStakeIndexForProject with multiple stakes", async function () {
            const { staking, serieProject, serieCoin, addr1 } = await loadFixture(deployStakingFixture);

            // Création de deux projets
            await serieProject.createProject(
                "Test Project 1",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test1",
                "ipfs://test1"
            );

            await serieProject.createProject(
                "Test Project 2",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test2",
                "ipfs://test2"
            );

            // Approve tokens for both projects
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("200"));

            // Invest in both projects
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(1, ethers.parseEther("100"));

            // Find stake index for first project
            const stakeIndex1 = await staking.getStakeIndexForProject(0, addr1.address);
            expect(stakeIndex1).to.equal(0);

            // Find stake index for second project
            const stakeIndex2 = await staking.getStakeIndexForProject(1, addr1.address);
            expect(stakeIndex2).to.equal(1);

            // Find stake index for non-existent project
            const stakeIndex3 = await staking.getStakeIndexForProject(2, addr1.address);
            expect(stakeIndex3).to.equal(ethers.MaxUint256);
        });

        it("Should handle project status changes during staking", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Create and invest in project
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Try to claim rewards before project completion
            await expect(staking.connect(addr1).claimRewards(0))
                .to.be.revertedWith("Project not completed");

            // Try to unstake before project completion
            await expect(staking.connect(addr1).unstakeAndClaim(0))
                .to.be.revertedWith("Project not completed");

            // Complete the project (using owner)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Fast forward time by 1 year to ensure there are rewards
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            // Now should be able to claim rewards
            await expect(staking.connect(addr1).claimRewards(0)).to.not.be.reverted;
        });

        

        it("Should handle multiple users staking in same project", async function () {
            const { staking, serieProject, serieCoin, addr1, addr2, owner } = await loadFixture(deployStakingFixture);

            // Create a project
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("200"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            // Both users approve tokens
            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieCoin.connect(addr2).approve(serieProject.target, ethers.parseEther("100"));

            // Both users invest
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));
            await serieProject.connect(addr2).investInProject(0, ethers.parseEther("100"));

            // Complete the project (using owner)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Fast forward time by 1 year
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            // Both users claim rewards
            await staking.connect(addr1).claimRewards(0);
            await staking.connect(addr2).claimRewards(0);

            // Check both stakes are marked as claimed
            const stakes1 = await staking.getUserStakes(addr1.address);
            const stakes2 = await staking.getUserStakes(addr2.address);
            expect(stakes1[0].claimed).to.equal(true);
            expect(stakes2[0].claimed).to.equal(true);
        });

        it("Should handle stake index validation in all functions", async function () {
            const { staking, serieProject, serieCoin, addr1, owner } = await loadFixture(deployStakingFixture);

            // Create and invest in project
            await serieProject.createProject(
                "Test Project",
                "Test Description",
                ethers.parseEther("100"),
                30,
                "ipfs://test",
                "ipfs://test"
            );

            await serieCoin.connect(addr1).approve(serieProject.target, ethers.parseEther("100"));
            await serieProject.connect(addr1).investInProject(0, ethers.parseEther("100"));

            // Complete the project (using owner)
            await serieProject.connect(owner).forceCompleteProject(0);

            // Test invalid stake index in calculateRewards
            await expect(staking.calculateRewards(addr1.address, 1))
                .to.be.revertedWith("Invalid stake index");

            // Test invalid stake index in claimRewards
            await expect(staking.connect(addr1).claimRewards(1))
                .to.be.revertedWith("Invalid stake index");

            // Test invalid stake index in unstakeAndClaim
            await expect(staking.connect(addr1).unstakeAndClaim(1))
                .to.be.revertedWith("Invalid stake index");
        });

        
    });
  });
  
