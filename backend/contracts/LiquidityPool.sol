// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// @title LiquidityPool
// @notice Contract for managing liquidity pools (USDC/SRC)
contract LiquidityPool is Ownable(msg.sender), ReentrancyGuard {
    struct PoolInfo {
        uint256 usdcBalance;
        uint256 srcBalance;
        uint256 totalLiquidity;
        uint256 lastUpdateTime;
        uint256 rewardRate;
        uint256 rewardPerTokenStored;
    }

    struct UserInfo {
        uint256 liquidityProvided;
        uint256 lastRewardTime;
        uint256 rewards;
    }

    IERC20 public usdcToken;
    IERC20 public srcToken;
    PoolInfo public poolInfo;
    mapping(address => UserInfo) public userInfo;

    event LiquidityAdded(address indexed user, uint256 usdcAmount, uint256 srcAmount);
    event LiquidityRemoved(address indexed user, uint256 usdcAmount, uint256 srcAmount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _usdcToken, address _srcToken) {
        usdcToken = IERC20(_usdcToken);
        srcToken = IERC20(_srcToken);
        poolInfo.rewardRate = 5; // 5% APY for liquidity providers
        poolInfo.lastUpdateTime = block.timestamp;
    }

    function addLiquidity(uint256 usdcAmount, uint256 srcAmount) external nonReentrant {
        require(usdcAmount > 0 && srcAmount > 0, "Amounts must be greater than 0");
        require(usdcToken.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");
        require(srcToken.transferFrom(msg.sender, address(this), srcAmount), "SRC transfer failed");

        updateRewards(msg.sender);

        UserInfo storage user = userInfo[msg.sender];
        user.liquidityProvided += usdcAmount + srcAmount;

        poolInfo.usdcBalance += usdcAmount;
        poolInfo.srcBalance += srcAmount;
        poolInfo.totalLiquidity += usdcAmount + srcAmount;

        emit LiquidityAdded(msg.sender, usdcAmount, srcAmount);
    }

    function removeLiquidity(uint256 amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(user.liquidityProvided >= amount, "Insufficient liquidity");

        updateRewards(msg.sender);

        uint256 usdcShare = (amount * poolInfo.usdcBalance) / poolInfo.totalLiquidity;
        uint256 srcShare = (amount * poolInfo.srcBalance) / poolInfo.totalLiquidity;

        user.liquidityProvided -= amount;
        poolInfo.usdcBalance -= usdcShare;
        poolInfo.srcBalance -= srcShare;
        poolInfo.totalLiquidity -= amount;

        require(usdcToken.transfer(msg.sender, usdcShare), "USDC transfer failed");
        require(srcToken.transfer(msg.sender, srcShare), "SRC transfer failed");

        emit LiquidityRemoved(msg.sender, usdcShare, srcShare);
    }

    function updateRewards(address user) internal {
        if (user != address(0)) {
            UserInfo storage userInfo = userInfo[user];
            uint256 timeElapsed = block.timestamp - userInfo.lastRewardTime;
            if (timeElapsed > 0 && userInfo.liquidityProvided > 0) {
                uint256 reward = (userInfo.liquidityProvided * poolInfo.rewardRate * timeElapsed) / (365 days * 100);
                userInfo.rewards += reward;
            }
            userInfo.lastRewardTime = block.timestamp;
        }
    }

    function claimRewards() external nonReentrant {
        updateRewards(msg.sender);
        UserInfo storage user = userInfo[msg.sender];
        uint256 rewards = user.rewards;
        require(rewards > 0, "No rewards to claim");

        user.rewards = 0;
        require(srcToken.transfer(msg.sender, rewards), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, rewards);
    }

    function getRewards(address user) external view returns (uint256) {
        UserInfo storage userInfo = userInfo[user];
        uint256 timeElapsed = block.timestamp - userInfo.lastRewardTime;
        if (timeElapsed > 0 && userInfo.liquidityProvided > 0) {
            return userInfo.rewards + (userInfo.liquidityProvided * poolInfo.rewardRate * timeElapsed) / (365 days * 100);
        }
        return userInfo.rewards;
    }

    function getPoolRatio() external view returns (uint256) {
        if (poolInfo.srcBalance == 0) return 0;
        return (poolInfo.usdcBalance * 1e18) / poolInfo.srcBalance;
    }
}
