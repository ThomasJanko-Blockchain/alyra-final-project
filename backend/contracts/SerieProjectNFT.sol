// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SerieCoin.sol";

contract SerieProjectNFT is ERC721, Ownable(msg.sender) {
    // Structure pour stocker les informations d'un projet
    struct Project {
        string title;
        string description;
        uint256 fundingGoal;
        uint256 currentFunding;
        uint256 duration; // en jours
        uint256 startTime;
        address producer;
        ProjectStatus status;
        string copyrightURI; // URI vers les métadonnées du droit d'auteur
        uint256 totalShares; // Nombre total de parts (10000 = 100%)
        string tokenURI;
    }

    // Énumération des différents statuts d'un projet
    enum ProjectStatus {
        WaitingForFunds,
        InProduction,
        Completed
    }

    // Variables d'état
    SerieCoin public serieCoin;
    Project[] public projects;
    uint256 public projectCount;
    
    // Mapping pour suivre les parts de chaque investisseur
    // projectId => (address => shares)
    mapping(uint256 => mapping(address => uint256)) public projectShares;
    
    // Événements
    event ProjectCreated(uint256 indexed projectId, string title, address producer);
    event ProjectFunded(uint256 indexed projectId, address investor, uint256 amount, uint256 shares);
    event ProjectStatusChanged(uint256 indexed projectId, ProjectStatus newStatus);
    event CopyrightRegistered(uint256 indexed projectId, string copyrightURI);
    event SharesTransferred(uint256 indexed projectId, address from, address to, uint256 shares);

    constructor(address _serieCoinAddress) ERC721("SerieProject", "SP") {
        serieCoin = SerieCoin(_serieCoinAddress);
    }

    // Fonction pour créer un nouveau projet
    function createProject(
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _duration,
        string memory _copyrightURI,
        string memory _tokenURI
    ) public {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        Project storage newProject = projects.push();
        newProject.title = _title;
        newProject.description = _description;
        newProject.fundingGoal = _fundingGoal;
        newProject.duration = _duration;
        newProject.producer = msg.sender;
        newProject.status = ProjectStatus.WaitingForFunds;
        newProject.copyrightURI = _copyrightURI;
        newProject.totalShares = 10000; // 100% des parts
        newProject.tokenURI = _tokenURI;

        // Mint the NFT to the producer
        _mint(msg.sender, projectCount);

        // Give initial shares to the producer
        projectShares[projectCount][msg.sender] = newProject.totalShares;

        emit ProjectCreated(projectCount, _title, msg.sender);
        emit CopyrightRegistered(projectCount, _copyrightURI);
        projectCount++;
    }

    // Fonction pour investir dans un projet
    function investInProject(uint256 _projectId, uint256 _amount) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.WaitingForFunds, "Project not in funding phase");
        require(_amount > 0, "Amount must be greater than 0");
        require(project.currentFunding + _amount <= project.fundingGoal, "Funding goal exceeded");

        // Transfert des tokens
        require(serieCoin.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        
        // Calcul des parts à attribuer
        uint256 sharesToMint = (_amount * project.totalShares) / project.fundingGoal;
        
        // Transfer shares from producer to investor
        require(projectShares[_projectId][project.producer] >= sharesToMint, "Producer has insufficient shares");
        projectShares[_projectId][project.producer] -= sharesToMint;
        projectShares[_projectId][msg.sender] += sharesToMint;
        
        project.currentFunding += _amount;

        // Si le projet est entièrement financé, on passe en production
        if (project.currentFunding >= project.fundingGoal) {
            project.status = ProjectStatus.InProduction;
            project.startTime = block.timestamp;
            emit ProjectStatusChanged(_projectId, ProjectStatus.InProduction);
        }

        emit ProjectFunded(_projectId, msg.sender, _amount, sharesToMint);
    }

    // Fonction pour transférer des parts
    function transferShares(uint256 _projectId, address _to, uint256 _shares) public {
        require(_projectId < projects.length, "Project does not exist");
        require(_shares > 0, "Amount must be greater than 0");
        require(projectShares[_projectId][msg.sender] >= _shares, "Insufficient shares");

        projectShares[_projectId][msg.sender] -= _shares;
        projectShares[_projectId][_to] += _shares;

        emit SharesTransferred(_projectId, msg.sender, _to, _shares);
    }

    // Fonction pour obtenir les parts d'un investisseur
    // function getShares(uint256 _projectId, address _investor) public view returns (uint256) {
    //     require(_projectId < projects.length, "Project does not exist");
    //     return projectShares[_projectId][_investor];
    // }

    // Fonction pour obtenir le pourcentage de parts d'un investisseur
    function getSharePercentage(uint256 _projectId, address _investor) public view returns (uint256) {
        require(_projectId < projects.length, "Project does not exist");
        return (projectShares[_projectId][_investor] * 100) / projects[_projectId].totalShares;
    }

    function forceCompleteProject(uint256 _projectId) public onlyOwner {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.InProduction, "Project not in production");
        project.status = ProjectStatus.Completed;
        emit ProjectStatusChanged(_projectId, ProjectStatus.Completed);
    }

    // Fonction pour marquer un projet comme terminé
    function completeProject(uint256 _projectId) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(project.producer == msg.sender, "Only producer can complete project");
        require(project.status == ProjectStatus.InProduction, "Project not in production");
        require(block.timestamp >= project.startTime + (project.duration * 1 days), "Project duration not reached");

        project.status = ProjectStatus.Completed;
        emit ProjectStatusChanged(_projectId, ProjectStatus.Completed);
    }

    // Fonction pour obtenir l'URI du token
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenId < projects.length, "Project does not exist");
        return projects[tokenId].tokenURI;
    }

    // Fonction pour obtenir l'URI du droit d'auteur
    function getCopyrightURI(uint256 _projectId) public view returns (string memory) {
        require(_projectId < projects.length, "Project does not exist");
        return projects[_projectId].copyrightURI;
    }

    function getProjectStatus(uint256 _projectId) public view returns (ProjectStatus) {
        require(_projectId < projects.length, "Project does not exist");
        return projects[_projectId].status;
    }
} 