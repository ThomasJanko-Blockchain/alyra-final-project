// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralizedLoan is Ownable(msg.sender) {
    IERC20 public euroa;
    IERC721 public projectNFT;
    uint256 public loanToValueRatio = 80; // 80%

    mapping(address => uint256) public collateralizedNFTs;
    mapping(address => uint256) public borrowedAmount;

    constructor(address _euroa, address _projectNFT) {
        euroa = IERC20(_euroa);
        projectNFT = IERC721(_projectNFT);
    }

    function collateralize(uint256 nftTokenId, uint256 loanAmount) external {
        require(projectNFT.ownerOf(nftTokenId) == msg.sender, "Not the NFT owner");
        require(loanAmount <= (loanToValueRatio * 1 ether) / 100, "Exceeds LTV ratio");

        projectNFT.transferFrom(msg.sender, address(this), nftTokenId);
        collateralizedNFTs[msg.sender] = nftTokenId;
        borrowedAmount[msg.sender] += loanAmount;

        euroa.transfer(msg.sender, loanAmount);
    }

    function repayLoan() external {
        
        require(borrowedAmount[msg.sender] > 0, "No active loan");

        euroa.transferFrom(msg.sender, address(this), borrowedAmount[msg.sender]);

        uint256 nftTokenId = collateralizedNFTs[msg.sender];
        projectNFT.transferFrom(address(this), msg.sender, nftTokenId);

        delete borrowedAmount[msg.sender];
        delete collateralizedNFTs[msg.sender];
    }
}
