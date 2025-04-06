// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SerieProjectNFT.sol";
import "./SerieCoin.sol";

contract Staking is Ownable(msg.sender) {
    // Structure pour stocker les informations de staking
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 projectId;
        bool isActive;
        bool claimed;
    }

    // Variables d'état
    SerieProjectNFT public serieProject;
    SerieCoin public serieCoin;
    mapping(address => Stake[]) public stakes;
    mapping(uint256 => uint256) public projectTotalStaked; // projectId => total staked amount
    uint256 public constant REWARD_RATE = 5; // 5% annual reward
    uint256 public constant REWARD_PERIOD = 365 days; // 1 year

    // Événements
    event Staked(address indexed user, uint256 indexed projectId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed projectId, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 indexed projectId, uint256 rewards);

    constructor(address _serieCoinAddress) {
        require(_serieCoinAddress != address(0), "Invalid SerieCoin address");
        serieCoin = SerieCoin(_serieCoinAddress);
    }

    // Add this function to set SerieProjectNFT after deployment
    function setSerieProjectNFT(address _serieProjectAddress) external onlyOwner {
        require(_serieProjectAddress != address(0), "Invalid SerieProjectNFT address");
        require(address(serieProject) == address(0), "SerieProjectNFT already set");
        serieProject = SerieProjectNFT(_serieProjectAddress);
    }

    // Fonction appelée par SerieProjectNFT lors d'un investissement
    function onInvestment(uint256 _projectId, address _investor, uint256 _amount) external {
        require(msg.sender == address(serieProject), "Only SerieProjectNFT can call this function");
        require(_amount > 0, "Investment amount must be greater than 0");
        
        // Créer un nouveau stake
        Stake memory newStake = Stake({
            amount: _amount,
            startTime: block.timestamp,
            projectId: _projectId,
            isActive: true,
            claimed: false
        });

        stakes[_investor].push(newStake);
        projectTotalStaked[_projectId] += _amount;
        
        emit Staked(_investor, _projectId, _amount);
    }

    // Fonction pour calculer les récompenses de staking
    function calculateRewards(address _user, uint256 _stakeIndex) public view returns (uint256) {
        require(_stakeIndex < stakes[_user].length, "Invalid stake index");
        Stake storage stake = stakes[_user][_stakeIndex];
        require(stake.isActive, "Stake is not active");
        require(!stake.claimed, "Rewards already claimed");

        uint256 timeStaked = block.timestamp - stake.startTime;
        if (timeStaked == 0) {
            return 0;
        }
        uint256 rewardRate = (REWARD_RATE * timeStaked) / REWARD_PERIOD;
        return (stake.amount * rewardRate) / 100;
    }

    // Fonction pour réclamer les récompenses
    function claimRewards(uint256 _stakeIndex) public {
        require(_stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        Stake storage stake = stakes[msg.sender][_stakeIndex];
        require(stake.isActive, "Stake is not active");
        require(!stake.claimed, "Rewards already claimed");
        
        // Vérifier que le projet est terminé
        require(
            serieProject.getProjectStatus(stake.projectId) == SerieProjectNFT.ProjectStatus.Completed,
            "Project not completed"
        );

        // Calculer les récompenses
        uint256 rewards = calculateRewards(msg.sender, _stakeIndex);
        require(rewards > 0, "No rewards to claim");

        // Marquer le stake comme réclamé
        stake.claimed = true;

        // Transférer les récompenses
        require(serieCoin.transfer(msg.sender, rewards), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, stake.projectId, rewards);
    }

    // Fonction pour unstaker et réclamer tout
    function unstakeAndClaim(uint256 _stakeIndex) public {
        require(_stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        
        Stake storage stake = stakes[msg.sender][_stakeIndex];
        require(stake.isActive, "Stake is not active");
        
        // Vérifier que le projet est terminé
        require(
            serieProject.getProjectStatus(stake.projectId) == SerieProjectNFT.ProjectStatus.Completed,
            "Project not completed"
        );

        uint256 rewards = 0;
        if (!stake.claimed) {
            rewards = calculateRewards(msg.sender, _stakeIndex);
        }

        // Marquer le stake comme inactif et réclamé
        stake.isActive = false;
        stake.claimed = true;

        // Mettre à jour le total staké du projet avant le transfert
        projectTotalStaked[stake.projectId] -= stake.amount;

        // Transférer le montant initial + les récompenses
        uint256 totalAmount = stake.amount + rewards;
        bool success = serieCoin.transfer(msg.sender, totalAmount);
        require(success, "Transfer failed");

        emit Unstaked(msg.sender, stake.projectId, stake.amount, rewards);
    }

    // Fonction pour obtenir les stakes d'un utilisateur
    function getUserStakes(address _user) public view returns (Stake[] memory) {
        return stakes[_user];
    }

    // Fonction pour obtenir le total staké d'un projet
    function getProjectTotalStaked(uint256 _projectId) public view returns (uint256) {
        return projectTotalStaked[_projectId];
    }

    // Add this function to find stake index for a specific project
    function getStakeIndexForProject(uint256 _projectId, address _user) public view returns (uint256) {
        Stake[] storage userStakes = stakes[_user];
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].projectId == _projectId && userStakes[i].isActive) {
                return i; // Return actual array index
            }
        }
        return type(uint256).max; // Return max value if no active stake is found
    }
}