// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @title Seriecoin
// @notice Contract for the native SerieCoin token
contract Seriecoin is ERC20, ERC20Burnable, Ownable(msg.sender) {
    uint256 public constant REWARD_RATE = 5; // 5% SRC rewards for protocol participation

    constructor() ERC20("Seriecoin", "SRC") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function mintRewards(address to, uint256 amount) external onlyOwner {
        uint256 rewardAmount = (amount * REWARD_RATE) / 100;
        _mint(to, rewardAmount);
    }
}