// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./SerieCoin.sol";

contract SerieProject is ERC1155, Ownable(msg.sender) {
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
    
    // Événements
    event ProjectCreated(uint256 indexed projectId, string title, address producer);
    event ProjectFunded(uint256 indexed projectId, address investor, uint256 amount);
    event ProjectStatusChanged(uint256 indexed projectId, ProjectStatus newStatus);
    event CopyrightRegistered(uint256 indexed projectId, string copyrightURI);

    constructor(address _serieCoinAddress) ERC1155("") {
        serieCoin = SerieCoin(_serieCoinAddress);
    }

    // Fonction pour créer un nouveau projet
    function createProject(
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _duration,
        string memory _copyrightURI
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

        // Calcul des parts (en pourcentage de 10000)
        uint256 sharesToMint = (_amount * project.totalShares) / project.fundingGoal;
        
        // Mint des tokens de parts
        _mint(msg.sender, _projectId, sharesToMint, "");
        project.currentFunding += _amount;

        // Si le projet est entièrement financé, on passe en production
        if (project.currentFunding >= project.fundingGoal) {
            project.status = ProjectStatus.InProduction;
            project.startTime = block.timestamp;
            emit ProjectStatusChanged(_projectId, ProjectStatus.InProduction);
        }

        emit ProjectFunded(_projectId, msg.sender, _amount);
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

    // Fonction pour obtenir les parts d'un investisseur dans un projet
    function getShares(uint256 _projectId, address _investor) public view returns (uint256) {
        require(_projectId < projects.length, "Project does not exist");
        return balanceOf(_investor, _projectId);
    }

    // Fonction pour obtenir le pourcentage de parts d'un investisseur
    function getSharePercentage(uint256 _projectId, address _investor) public view returns (uint256) {
        require(_projectId < projects.length, "Project does not exist");
        return (balanceOf(_investor, _projectId) * 100) / projects[_projectId].totalShares;
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