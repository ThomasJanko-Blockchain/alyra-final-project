// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @title AuthorRightsNFT
// @notice NFT des Droits d'Auteur
contract AuthorRightsNFT is ERC721URIStorage, Ownable(msg.sender) {
    uint256 private _tokenIds;

    constructor() ERC721("AuthorRightsNFT", "ARF") {}

    // Crée un nouveau NFT avec des métadonnées associées
    function mintNFT(address recipient, string memory tokenURI) external onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
}
