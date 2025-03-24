// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @title Seriecoin
// @notice Contrat pour la création du token natif SerieCoin
contract Seriecoin is ERC20, ERC20Burnable, Ownable(msg.sender) {
    // @dev Constructeur: initialise le contrat avec le nom et le symbole du token
    constructor() ERC20("Seriecoin", "SRC") {}

    // @dev Fonction pour créer des fractions du NFT
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
