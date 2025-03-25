**1. Contrats Intelligents Nécessaires :**

- Contrat de Token ERC-20 pour SerieCoin (SRC) :

    - Gère l'émission et les transactions du token natif utilisé sur la plateforme.​

- Contrat de Token ERC-721 pour les NFT des Droits d'Auteur :

    - Représente la propriété des droits de cession d'un projet audiovisuel sous forme de NFT unique.​

- Contrat de Fractionnement des NFT (fNFT) :

    - Permet de diviser un NFT ERC-721 en plusieurs tokens ERC-20 fractionnés, représentant des parts des droits d'auteur.​

- Contrat de Staking :

    - Gère le staking des tokens SRC par les investisseurs et distribue les fNFT en conséquence.​

- Contrat de Prêt :

    - Permet aux producteurs d'emprunter des USDC en utilisant les fNFT comme garantie.​

- Contrat de Distribution des Revenus :

    - Distribue les revenus générés par le projet aux détenteurs de fNFT en fonction de leurs parts.​



**2. Fonctions à Implémenter dans les Contrats :**

- Dans le Contrat ERC-20 (SerieCoin) :

    - mint(address to, uint256 amount): Émet de nouveaux tokens SRC à une adresse spécifique.​

    - burn(uint256 amount): Brûle une quantité spécifique de tokens SRC de l'appelant.​

- Dans le Contrat ERC-721 (NFT des Droits d'Auteur) :

    - mintNFT(address to, uint256 tokenId, string memory metadata): Crée un nouveau NFT avec des métadonnées associées.​

    - transferFrom(address from, address to, uint256 tokenId): Transfère la propriété d'un NFT.​

- Dans le Contrat de Fractionnement des NFT :

    - fractionalize(uint256 tokenId, uint256 fractions): Divise un NFT en un nombre spécifié de tokens ERC-20 fractionnés.​

    - redeem(uint256 fractions): Permet aux détenteurs de fNFT de racheter les fractions pour récupérer une partie du NFT original.​

- Dans le Contrat de Staking :

    - stake(uint256 amount): Permet aux investisseurs de staker leurs tokens SRC.​

    - unstake(uint256 amount): Permet aux investisseurs de retirer leurs tokens stakés.​

    - claimRewards(): Réclame les fNFT et autres récompenses accumulées grâce au staking.​

- Dans le Contrat de Prêt :

    - borrow(uint256 amount, uint256 collateral): Permet aux producteurs d'emprunter des USDC en fournissant des fNFT en garantie.​

    - repay(uint256 amount): Rembourse le prêt en USDC.​

    - liquidate(address borrower): Liquide la garantie si l'emprunteur ne respecte pas les conditions du prêt.​

- Dans le Contrat de Distribution des Revenus :

    - distribute(uint256 totalRevenue): Distribue les revenus aux détenteurs de fNFT en fonction de leurs parts.​

    - claimRevenue(): Permet aux détenteurs de fNFT de réclamer leurs parts des revenus distribués.​

