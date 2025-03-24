// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @title ProjectNFT
// @notice Contrat pour la création de fractions d'un NFT
contract ProjectNFT is ERC721Enumerable, Ownable(msg.sender) {
    uint256 public totalFraction;
    uint256 public tokenCounter;
    string public projectMetadata;

    mapping(uint256 => uint256) public fractionalOwnership;

    // @dev Constructeur: initialise le contrat avec le metadata du projet et le nombre de fractions
    constructor(string memory _projectMetadata, uint256 _totalFraction) 
        ERC721("ProjectNFT", "pNFT")
    {
        projectMetadata = _projectMetadata;
        totalFraction = _totalFraction;
        tokenCounter = 0;
    }

    // @dev Fonction pour créer des fractions du NFT
    function mintFraction(address to, uint256 fraction) external onlyOwner {
        require(tokenCounter + fraction <= totalFraction, "Exceeds total fractions");
        for (uint256 i = 0; i < fraction; i++) {
            fractionalOwnership[tokenCounter] = fraction;
            _safeMint(to, tokenCounter);
            tokenCounter++;
        }
    }
}
