// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SerieCoin is ERC20, Ownable(msg.sender) {
    constructor() ERC20("SerieCoin", "SRC") {
        // Mint initial supply to the contract deployer
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Fonction pour créer de nouveaux tokens (seul le propriétaire peut le faire)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Fonction pour brûler des tokens
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
} 