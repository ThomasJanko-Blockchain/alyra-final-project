// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @title ProjectNFT
// @notice Contract for managing project rights and funding
contract ProjectNFT is ERC721Enumerable, Ownable(msg.sender) {
    struct Project {
        string title;
        string genre;
        string[] writers;
        string origin;
        string synopsis;
        uint256 productionTime; // in months
        uint256 fundingGoal;
        uint256 usdcAPY;
        uint256 srcAPY;
        uint256 totalRights;
        uint256 rightsAvailable;
        bool isActive;
        bool isCompleted;
        uint256 startDate;
        uint256 endDate;
    }

    uint256 public projectCounter;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public rightsOwnership;
    mapping(uint256 => uint256) public totalInvested;
    mapping(uint256 => uint256) public lastInterestPayment;

    IERC20 public usdcToken;
    IERC20 public srcToken;

    event ProjectCreated(uint256 indexed projectId, string title, uint256 fundingGoal);
    event RightsPurchased(uint256 indexed projectId, address indexed buyer, uint256 amount);
    event RightsRedeemed(uint256 indexed projectId, address indexed owner, uint256 amount);
    event InterestPaid(uint256 indexed projectId, address indexed investor, uint256 amount);

    constructor(address _usdcToken, address _srcToken) ERC721("ProjectNFT", "pNFT") {
        usdcToken = IERC20(_usdcToken);
        srcToken = IERC20(_srcToken);
    }

    function createProject(
        string memory _title,
        string memory _genre,
        string[] memory _writers,
        string memory _origin,
        string memory _synopsis,
        uint256 _productionTime,
        uint256 _fundingGoal,
        uint256 _usdcAPY,
        uint256 _srcAPY,
        uint256 _totalRights
    ) external onlyOwner {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_totalRights > 0, "Total rights must be greater than 0");

        Project storage project = projects[projectCounter];
        project.title = _title;
        project.genre = _genre;
        project.writers = _writers;
        project.origin = _origin;
        project.synopsis = _synopsis;
        project.productionTime = _productionTime;
        project.fundingGoal = _fundingGoal;
        project.usdcAPY = _usdcAPY;
        project.srcAPY = _srcAPY;
        project.totalRights = _totalRights;
        project.rightsAvailable = _totalRights;
        project.isActive = true;
        project.isCompleted = false;
        project.startDate = block.timestamp;
        project.endDate = block.timestamp + (_productionTime * 30 days);

        emit ProjectCreated(projectCounter, _title, _fundingGoal);
        projectCounter++;
    }

    function purchaseRights(uint256 _projectId, uint256 _amount) external {
        Project storage project = projects[_projectId];
        require(project.isActive, "Project is not active");
        require(project.rightsAvailable >= _amount, "Not enough rights available");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 investmentAmount = (_amount * project.fundingGoal) / project.totalRights;
        require(usdcToken.transferFrom(msg.sender, address(this), investmentAmount), "USDC transfer failed");

        project.rightsAvailable -= _amount;
        rightsOwnership[_projectId][msg.sender] += _amount;
        totalInvested[_projectId] += investmentAmount;

        // Mint SRC tokens as rewards (1 SRC per 10 USDC)
        uint256 srcRewards = investmentAmount / 10;
        srcToken.transfer(msg.sender, srcRewards);

        emit RightsPurchased(_projectId, msg.sender, _amount);
    }

    function redeemRights(uint256 _projectId, uint256 _amount) external {
        Project storage project = projects[_projectId];
        require(project.isCompleted, "Project is not completed");
        require(rightsOwnership[_projectId][msg.sender] >= _amount, "Not enough rights owned");

        rightsOwnership[_projectId][msg.sender] -= _amount;
        project.rightsAvailable += _amount;

        emit RightsRedeemed(_projectId, msg.sender, _amount);
    }

    function calculateAndPayInterest(uint256 _projectId) external {
        Project storage project = projects[_projectId];
        require(project.isActive, "Project is not active");
        require(block.timestamp >= lastInterestPayment[_projectId] + 30 days, "Too early for interest payment");

        uint256 timeElapsed = block.timestamp - lastInterestPayment[_projectId];
        uint256 interestRate = (project.usdcAPY * timeElapsed) / (365 days * 100);
        
        uint256 rightsOwned = rightsOwnership[_projectId][msg.sender];
        uint256 investmentAmount = (rightsOwned * project.fundingGoal) / project.totalRights;
        uint256 interestAmount = (investmentAmount * interestRate) / 100;

        require(usdcToken.transfer(msg.sender, interestAmount), "Interest payment failed");
        lastInterestPayment[_projectId] = block.timestamp;

        emit InterestPaid(_projectId, msg.sender, interestAmount);
    }

    function completeProject(uint256 _projectId) external onlyOwner {
        Project storage project = projects[_projectId];
        require(project.isActive, "Project is not active");
        require(block.timestamp >= project.endDate, "Project not finished");

        project.isActive = false;
        project.isCompleted = true;
    }
}
