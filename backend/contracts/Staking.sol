// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// @title Staking
// @notice Contract for staking project rights and SRC tokens
contract Staking is Ownable(msg.sender) {
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastRewardTime;
        uint256 projectId; // 0 for SRC staking, >0 for project rights staking
    }

    IERC20 public srcToken;
    IERC721 public projectNFT;
    uint256 public srcRewardRate; // SRC rewards per day
    uint256 public rightsRewardRate; // Rights rewards per day
    uint256 public totalStakedSRC;
    uint256 public totalStakedRights;

    mapping(address => StakeInfo[]) public stakes;
    mapping(address => uint256) public totalRewards;

    event Staked(address indexed user, uint256 amount, uint256 projectId);
    event Unstaked(address indexed user, uint256 amount, uint256 projectId);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _srcToken, address _projectNFT) {
        srcToken = IERC20(_srcToken);
        projectNFT = IERC721(_projectNFT);
        srcRewardRate = 5; // 5% APY for SRC staking
        rightsRewardRate = 10; // 10% APY for rights staking
    }

    function stakeSRC(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(srcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        StakeInfo memory newStake = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lastRewardTime: block.timestamp,
            projectId: 0
        });

        stakes[msg.sender].push(newStake);
        totalStakedSRC += amount;

        emit Staked(msg.sender, amount, 0);
    }

    function stakeRights(uint256 projectId, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(projectNFT.ownerOf(projectId) == msg.sender, "Not the owner of these rights");

        StakeInfo memory newStake = StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lastRewardTime: block.timestamp,
            projectId: projectId
        });

        stakes[msg.sender].push(newStake);
        totalStakedRights += amount;

        emit Staked(msg.sender, amount, projectId);
    }

    function unstakeSRC(uint256 stakeIndex) external {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        StakeInfo storage stake = stakes[msg.sender][stakeIndex];
        require(stake.projectId == 0, "Not a SRC stake");

        uint256 amount = stake.amount;
        totalStakedSRC -= amount;
        delete stakes[msg.sender][stakeIndex];

        require(srcToken.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount, 0);
    }

    function unstakeRights(uint256 stakeIndex) external {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        StakeInfo storage stake = stakes[msg.sender][stakeIndex];
        require(stake.projectId > 0, "Not a rights stake");

        uint256 amount = stake.amount;
        totalStakedRights -= amount;
        delete stakes[msg.sender][stakeIndex];

        emit Unstaked(msg.sender, amount, stake.projectId);
    }

    function calculateRewards(address user) public view returns (uint256) {
        uint256 totalReward = 0;
        StakeInfo[] storage userStakes = stakes[user];

        for (uint256 i = 0; i < userStakes.length; i++) {
            StakeInfo storage stake = userStakes[i];
            uint256 timeElapsed = block.timestamp - stake.lastRewardTime;
            uint256 rewardRate = stake.projectId == 0 ? srcRewardRate : rightsRewardRate;
            
            uint256 reward = (stake.amount * rewardRate * timeElapsed) / (365 days * 100);
            totalReward += reward;
        }

        return totalReward;
    }

    function claimRewards() external {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");

        // Update last reward time for all stakes
        StakeInfo[] storage userStakes = stakes[msg.sender];
        for (uint256 i = 0; i < userStakes.length; i++) {
            userStakes[i].lastRewardTime = block.timestamp;
        }

        totalRewards[msg.sender] += rewards;
        require(srcToken.transfer(msg.sender, rewards), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, rewards);
    }
}
