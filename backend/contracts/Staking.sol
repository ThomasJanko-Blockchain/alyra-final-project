// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SerieProjectNFT.sol";

contract Staking is Ownable(msg.sender) {
    // Structure pour stocker les informations de staking
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 projectId;
        bool isActive;
    }

    // Variables d'état
    SerieProjectNFT public serieProject;
    mapping(address => Stake[]) public stakes;
    uint256 public constant STAKING_RATE = 5; // 5% de récompense
    uint256 public constant STAKING_PERIOD = 365 days; // 1 an

    // Événements
    event Staked(address indexed user, uint256 indexed projectId, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed projectId, uint256 amount);

    constructor(address _serieProjectAddress) {
        serieProject = SerieProjectNFT(_serieProjectAddress);
    }

    // Fonction pour staker ses parts
    function stake(uint256 _projectId, uint256 _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        
        // Vérifier que l'utilisateur a les parts nécessaires
        uint256 userShares = serieProject.getSharePercentage(_projectId, msg.sender);
        require(userShares >= _amount, "Insufficient shares");

        // Créer un nouveau stake
        Stake memory newStake = Stake({
            amount: _amount,
            startTime: block.timestamp,
            projectId: _projectId,
            isActive: true
        });

        stakes[msg.sender].push(newStake);
        emit Staked(msg.sender, _projectId, _amount);
    }

    // Fonction pour calculer les récompenses de staking
    function calculateRewards(address _user, uint256 _stakeIndex) public view returns (uint256) {
        Stake storage stake = stakes[_user][_stakeIndex];
        require(stake.isActive, "Stake is not active");

        uint256 timeStaked = block.timestamp - stake.startTime;
        uint256 rewardRate = (STAKING_RATE * timeStaked) / STAKING_PERIOD;
        return (stake.amount * rewardRate) / 100;
    }

    // Fonction pour unstaker ses parts
    function unstake(uint256 _stakeIndex) public {
        Stake storage stake = stakes[msg.sender][_stakeIndex];
        require(stake.isActive, "Stake is not active");

        // Vérifier que le projet est terminé
        require(serieProject.getProjectStatus(stake.projectId) == SerieProjectNFT.ProjectStatus.Completed, "Project not completed");

        // Calculer les récompenses
        uint256 rewards = calculateRewards(msg.sender, _stakeIndex);

        // Marquer le stake comme inactif
        stake.isActive = false;

        // Transférer les parts et les récompenses
        // Note: Cette partie nécessiterait une implémentation supplémentaire pour gérer le transfert des tokens

        emit Unstaked(msg.sender, stake.projectId, stake.amount);
    }
}