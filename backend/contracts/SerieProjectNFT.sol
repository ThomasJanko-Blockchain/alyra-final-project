// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SerieCoin.sol";

contract SerieProjectNFT is ERC721, Ownable(msg.sender) {
    // Structure pour stocker les informations d'un projet
    struct Project {
        uint96 fundingGoal;
        uint96 currentFunding;
        uint32 duration;
        uint32 startTime;
        uint16 totalShares;
        bool refundClaimed;
        address producer;
        ProjectStatus status;
        string title;
        string description;
        string copyrightURI;
        string tokenURI;
    }

    // Énumération des différents statuts d'un projet
    enum ProjectStatus {
        WaitingForFunds,
        InProduction,
        Completed
    }

    // Variables d'état
    SerieCoin private immutable serieCoin;
    Project[] public projects;
    uint32 public projectCount;
    
    // Mapping pour suivre les parts de chaque investisseur
    mapping(uint256 => mapping(address => uint16)) public projectShares;
    
    // Événements
    event ProjectCreated(uint256 indexed projectId, string title, address indexed producer, string tokenURI);
    event ProjectFunded(uint256 indexed projectId, address indexed investor, uint96 amount, uint16 shares);
    event ProjectStatusChanged(uint256 indexed projectId, ProjectStatus newStatus);
    event CopyrightRegistered(uint256 indexed projectId, string copyrightURI);
    event SharesTransferred(uint256 indexed projectId, address indexed from, address indexed to, uint16 shares);
    event RefundClaimed(uint256 indexed projectId, address indexed investor, uint96 amount);

    error ProjectDoesNotExist();

    // Modifier pour vérifier si le projet existe
    modifier projectExists(uint256 _projectId) {
        // require(_projectId < projects.length, "Project does not exist");
        if (_projectId >= projects.length) revert ProjectDoesNotExist();
        _;
    }

    //CONSTRUCTOR
    constructor(address _serieCoinAddress) ERC721("SerieProject", "SP") {
        require(_serieCoinAddress != address(0), "Invalid SerieCoin address");
        serieCoin = SerieCoin(_serieCoinAddress);
    }

    // Fonction pour créer un nouveau projet
    function createProject(
        string calldata _title,
        string calldata _description,
        uint96 _fundingGoal,
        uint32 _duration,
        string calldata _copyrightURI,
        string calldata _tokenURI
    ) external {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_duration > 0 && _duration <= 3650, "Invalid duration"); // Max 10 ans
        require(bytes(_title).length > 0 && bytes(_title).length <= 200, "Invalid title length");
        require(bytes(_description).length > 0, "Invalid description length");
        require(bytes(_copyrightURI).length > 0, "Copyright URI cannot be empty");
        require(bytes(_tokenURI).length > 0, "Token URI cannot be empty");

        uint32 newProjectId = projectCount;
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
        newProject.refundClaimed = false;

        // Mint le NFT au créateur du projet
        _mint(msg.sender, newProjectId);

        // Donner les parts initiales au créateur du projet
        projectShares[newProjectId][msg.sender] = 10000;

        emit ProjectCreated(newProjectId, _title, msg.sender, _tokenURI);
        emit CopyrightRegistered(newProjectId, _copyrightURI);
        
        unchecked {
            projectCount++;
        }
    }

    // Fonction pour investir dans un projet
    function investInProject(uint256 _projectId, uint96 _amount) external projectExists(_projectId) {
        Project storage project = projects[_projectId];
        // Cache frequently used values
        uint96 currentFunding = project.currentFunding;
        uint96 fundingGoal = project.fundingGoal;
        require(currentFunding + _amount <= fundingGoal, "Funding goal exceeded");
        require(project.status == ProjectStatus.WaitingForFunds, "Project not in funding phase");
        require(_amount > 0, "Amount must be greater than 0");
        
        uint96 newFunding = currentFunding + _amount;

        // Calcul des parts à attribuer
        uint16 sharesToMint = uint16((_amount * uint256(project.totalShares)) / fundingGoal);
        require((_amount * uint256(project.totalShares)) / fundingGoal <= type(uint16).max, "Share calculation overflow");
        require(projectShares[_projectId][project.producer] >= sharesToMint, "Producer has insufficient shares");

        // Mise à jour du montant actuel de financement
        project.currentFunding = newFunding;
        
        unchecked {
            projectShares[_projectId][project.producer] -= sharesToMint;
            projectShares[_projectId][msg.sender] += sharesToMint;
        }

        // Transfert des tokens
        require(serieCoin.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        // Vérification si le projet est entièrement financé
        if (newFunding >= fundingGoal) {
            project.status = ProjectStatus.InProduction;
            project.startTime = uint32(block.timestamp);
            emit ProjectStatusChanged(_projectId, ProjectStatus.InProduction);
        }

        emit ProjectFunded(_projectId, msg.sender, _amount, sharesToMint);
    }

    // Fonction pour transférer des parts
    function transferShares(uint256 _projectId, address _to, uint16 _shares) external projectExists(_projectId) {
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot transfer shares to yourself");
        require(_shares > 0, "Amount must be greater than 0");
        require(projectShares[_projectId][msg.sender] >= _shares, "Insufficient shares");

        unchecked {
            projectShares[_projectId][msg.sender] -= _shares;
            projectShares[_projectId][_to] += _shares;
        }

        emit SharesTransferred(_projectId, msg.sender, _to, _shares);
    }

    // Fonction pour obtenir le pourcentage de parts d'un investisseur
    function getSharePercentage(uint256 _projectId, address _investor) external view projectExists(_projectId) returns (uint256) {
        return (uint256(projectShares[_projectId][_investor]) * 100) / projects[_projectId].totalShares;
    }

    // Fonction pour forcer la fin d'un projet
    function forceCompleteProject(uint256 _projectId) external onlyOwner projectExists(_projectId) {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.InProduction, "Project not in production");
        project.status = ProjectStatus.Completed;
        emit ProjectStatusChanged(_projectId, ProjectStatus.Completed);
    }

    // Fonction pour marquer un projet comme terminé
    function completeProject(uint256 _projectId) external projectExists(_projectId) {
        Project storage project = projects[_projectId];
        require(project.producer == msg.sender, "Only producer can complete project");
        require(project.status == ProjectStatus.InProduction, "Project not in production");
        require(block.timestamp >= project.startTime + (uint256(project.duration) * 1 days), "Project duration not reached");

        project.status = ProjectStatus.Completed;
        emit ProjectStatusChanged(_projectId, ProjectStatus.Completed);
    }

    // Fonction pour obtenir l'URI du token
    function tokenURI(uint256 tokenId) public view override projectExists(tokenId) returns (string memory) {
        return projects[tokenId].tokenURI;
    }

    // Fonction pour obtenir l'URI du droit d'auteur
    function getCopyrightURI(uint256 _projectId) external view projectExists(_projectId) returns (string memory) {
        return projects[_projectId].copyrightURI;
    }

    function getProjectStatus(uint256 _projectId) external view projectExists(_projectId) returns (ProjectStatus) {
        return projects[_projectId].status;
    }

    // Fonction pour réclamer le remboursement une fois le projet terminé
    function claimRefund(uint256 _projectId) external projectExists(_projectId) {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Completed, "Project not completed");
        require(!project.refundClaimed, "Refund already claimed");
        require(projectShares[_projectId][msg.sender] > 0, "No shares to claim refund for");

        uint16 shares = projectShares[_projectId][msg.sender];
        uint96 refundAmount = uint96((uint256(shares) * uint256(project.currentFunding)) / project.fundingGoal);

        projectShares[_projectId][msg.sender] = 0;

        require(serieCoin.transfer(msg.sender, refundAmount), "Refund transfer failed");

        emit RefundClaimed(_projectId, msg.sender, refundAmount);
    }
}