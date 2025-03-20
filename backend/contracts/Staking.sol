// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable(msg.sender) {
    IERC20 public srcToken;
    IERC721 public projectNFT;
    mapping(address => uint256) public stakedAmount;

    constructor(address _srcToken, address _projectNFT) {
        srcToken = IERC20(_srcToken);
        projectNFT = IERC721(_projectNFT);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        srcToken.transferFrom(msg.sender, address(this), amount);
        stakedAmount[msg.sender] += amount;
    }

    function redeem(uint256 nftTokenId) external {
        require(projectNFT.ownerOf(nftTokenId) == address(this), "NFT not staked");
        require(stakedAmount[msg.sender] > 0, "No staked SRC tokens");

        projectNFT.transferFrom(address(this), msg.sender, nftTokenId);
        stakedAmount[msg.sender] = 0;
    }
}
