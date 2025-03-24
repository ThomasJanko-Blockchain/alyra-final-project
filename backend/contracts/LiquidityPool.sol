// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @title LiquidityPool
// @notice Contrat pour la création de la pool de liquidité (Euroa / SerieCoin)
contract LiquidityPool is Ownable(msg.sender) {
    IERC20 public euroa;
    IERC20 public src;

    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidityProvided;

    constructor(address _euroa, address _src) {
        euroa = IERC20(_euroa);
        src = IERC20(_src);
    }

    // @dev Fonction pour ajouter de la liquidité à la pool
    function addLiquidity(uint256 euroaAmount, uint256 srcAmount) external {
        euroa.transferFrom(msg.sender, address(this), euroaAmount);
        src.transferFrom(msg.sender, address(this), srcAmount);
        liquidityProvided[msg.sender] += euroaAmount + srcAmount;
        totalLiquidity += euroaAmount + srcAmount;
    }

    // @dev Fonction pour retirer de la liquidité de la pool
    function removeLiquidity(uint256 amount) external {
        require(liquidityProvided[msg.sender] >= amount, "Insufficient liquidity");
        uint256 euroaShare = (amount * euroa.balanceOf(address(this))) / totalLiquidity;
        uint256 srcShare = (amount * src.balanceOf(address(this))) / totalLiquidity;

        euroa.transfer(msg.sender, euroaShare);
        src.transfer(msg.sender, srcShare);

        liquidityProvided[msg.sender] -= amount;
        totalLiquidity -= amount;
    }
}
