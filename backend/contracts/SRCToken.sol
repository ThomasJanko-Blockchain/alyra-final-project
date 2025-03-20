// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SRCToken is ERC20, ERC20Burnable, Ownable(msg.sender) {
    constructor(uint256 initialSupply) ERC20("SerieCoin", "SRC") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
