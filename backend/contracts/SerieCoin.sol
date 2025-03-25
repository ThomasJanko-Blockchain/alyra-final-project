// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SerieCoin is ERC20, Ownable(msg.sender) {
    constructor() ERC20("SerieCoin", "SRC") {}

    // Émet de nouveaux tokens SRC à une adresse spécifique
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Brûle une quantité spécifique de tokens SRC
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
