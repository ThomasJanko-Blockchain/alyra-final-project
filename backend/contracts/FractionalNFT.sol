// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionalNFT is ERC20, Ownable(msg.sender) {
    IERC721 public nft;
    uint256 public tokenId;
    bool public fractionsMinted;

    // @dev Constructeur: initialise le contrat avec le NFT et le tokenId
    // @param _nft: adresse du NFT
    // @param _tokenId: id du NFT
    // @param name: nom du token
    // @param symbol: symbole du token
    constructor(address _nft, uint256 _tokenId, string memory name, string memory symbol) ERC20(name, symbol) {
        nft = IERC721(_nft);
        tokenId = _tokenId;
    }

    // @dev Fonction pour créer des fractions du NFT
    // @param totalFractions: nombre de fractions à créer
    function mintFractions(uint256 totalFractions) public onlyOwner {
        require(!fractionsMinted, "Fractions already minted");
        require(nft.ownerOf(tokenId) == address(this), "Contract does not own NFT");
        _mint(msg.sender, totalFractions);
        fractionsMinted = true;
    }

    // @dev Fonction pour récupérer le NFT
    // @param msg.sender: adresse du propriétaire du NFT
    function redeemNFT() public {
        require(balanceOf(msg.sender) == totalSupply(), "Must own all fractions to redeem");
        nft.transferFrom(address(this), msg.sender, tokenId);
    }
}
