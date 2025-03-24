// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @title Staking
// @notice Contrat pour le staking des tokens
contract Staking is Ownable(msg.sender) {
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    uint256 public rewardRate; // Rewards per block
    uint256 public lastUpdateBlock;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;

    uint256 private _totalSupply;

    // @dev Constructeur: initialise le contrat avec les paramètres du staking
    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        lastUpdateBlock = block.number;
    }

    // @dev Fonction pour staker des tokens
    function stake(uint256 amount) public {
        updateReward(msg.sender);
        stakingToken.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        _totalSupply += amount;
    }

    // @dev Fonction pour retirer des tokens
    function withdraw(uint256 amount) public {
        updateReward(msg.sender);
        balances[msg.sender] -= amount;
        _totalSupply -= amount;
        stakingToken.transfer(msg.sender, amount);
    }

    // @dev Fonction pour récupérer les rewards
    function claimReward() public {
        updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        rewardToken.transfer(msg.sender, reward);
    }

    // @dev Fonction pour mettre à jour les rewards
    function updateReward(address account) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateBlock = block.number;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
    }

    // @dev Fonction pour calculer les rewards par token
    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + ((block.number - lastUpdateBlock) * rewardRate * 1e18 / _totalSupply);
    }

    // @dev Fonction pour calculer les rewards par token
    function earned(address account) public view returns (uint256) {
        return (balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18) + rewards[account];
    }
}
