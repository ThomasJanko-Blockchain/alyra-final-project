// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FractionalNFT.sol";

// @title Staking
// @notice Contrat pour le staking de SRC tokens
contract Staking is Ownable(msg.sender) {
    IERC20 public serieCoin;
    FractionalNFT public fNFT;
    uint256 public rewardRate;

    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public rewardBalances;

    constructor(address _serieCoin, address _fNFT, uint256 _rewardRate) {
        serieCoin = IERC20(_serieCoin);
        fNFT = FractionalNFT(_fNFT);
        rewardRate = _rewardRate;
    }

    // Permet aux investisseurs de staker leurs tokens SRC
    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        serieCoin.transferFrom(msg.sender, address(this), amount);
        stakedBalances[msg.sender] += amount;
        rewardBalances[msg.sender] += amount * rewardRate;
    }

    // Permet aux investisseurs de retirer leurs tokens stakés.
    function withdraw(uint256 amount) external {
        require(stakedBalances[msg.sender] >= amount, "Insufficient balance");
        stakedBalances[msg.sender] -= amount;
        serieCoin.transfer(msg.sender, amount);
    }

    // Réclame les fNFT et autres récompenses accumulées grâce au staking.
    function claimRewards() external {
        uint256 reward = rewardBalances[msg.sender];
        require(reward > 0, "No rewards to claim");
        rewardBalances[msg.sender] = 0;
        fNFT.transfer(msg.sender, reward);
    }
}
