// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ILocker {
    /**
     * @dev Fails if transaction is not allowed.
     * Return values can be ignored for AntiBot launches.
     */
    function lockOrGetPenalty(address source, address dest)
        external
        returns (bool, uint256);
}

contract SRC_old is ERC20, ERC20Burnable, Ownable {
    ILocker public locker;

    constructor(uint256 initialSupply) 
        ERC20("SerieCoin Token", "SRC") Ownable(msg.sender) { // Pass msg.sender to Ownable constructor 
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Sets the locker contract address. Only the owner can call this.
     */
    function setLocker(address _locker) external onlyOwner {
        locker = ILocker(_locker);
    }

    /**
     * @dev Hook that is called before any transfer of tokens. 
     * If a locker is set, it will validate the transfer.
     */
     function _beforeTokenTransfer(address from, address to, uint256) internal {
        if( address(locker) != address(0) ) {
            locker.lockOrGetPenalty( from, to );
        }
    }
}
