// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./FractionalNFT.sol";

// @title Lending
// @notice Contrat pour le prêt de fNFT en garantie
contract Lending {
    IERC20 public usdc;
    FractionalNFT public fNFT;
    uint256 public collateralFactor; // e.g., 70 means 70%

    mapping(address => uint256) public loanBalances;
    mapping(address => uint256) public collateralBalances;

    constructor(address _usdc, address _fNFT, uint256 _collateralFactor) {
        usdc = IERC20(_usdc);
        fNFT = FractionalNFT(_fNFT);
        collateralFactor = _collateralFactor;
    }

    // Permet aux producteurs d'emprunter des USDC en fournissant des fNFT en garantie
    function borrow(uint256 fNFTAmount) external {
        uint256 loanAmount = (fNFTAmount * collateralFactor) / 100;
        fNFT.transferFrom(msg.sender, address(this), fNFTAmount);
        collateralBalances[msg.sender] += fNFTAmount;
        loanBalances[msg.sender] += loanAmount;
        usdc.transfer(msg.sender, loanAmount);
    }

    // Rembourse le prêt en USDC
    function repay(uint256 usdcAmount) external {
        require(loanBalances[msg.sender] >= usdcAmount, "Repay amount exceeds loan");
        uint256 collateralToReturn = (usdcAmount * 100) / collateralFactor;
        require(collateralBalances[msg.sender] >= collateralToReturn, "Insufficient collateral");
        usdc.transferFrom(msg.sender, address(this), usdcAmount);
        loanBalances[msg.sender] -= usdcAmount;
        collateralBalances[msg.sender] -= collateralToReturn;
        fNFT.transfer(msg.sender, collateralToReturn);
    }

    // Liquidation des fNFT en cas de non-remboursement du prêt
    function liquidate(address borrower) external {
        require(loanBalances[borrower] > 0, "No loan to liquidate");
        require(block.timestamp >= loanBalances[borrower] + 30 days, "Loan is not yet due");
        uint256 collateralToReturn = collateralBalances[borrower];
        loanBalances[borrower] = 0;
        collateralBalances[borrower] = 0;
        fNFT.transfer(msg.sender, collateralToReturn);
    }
}
