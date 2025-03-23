Objectifs du protocole

1.  Permettre aux producteurs de financer leurs films en déposant des NFT de droits d’auteur comme collatéral.
    
2.  Fractionner ces NFT pour les rendre accessibles aux petits investisseurs via Seriecoin.
    
3.  Offrir un mécanisme de staking de Seriecoin pour distribuer les fractions de NFT.
    
4.  Permettre aux producteurs d’emprunter des USDC pour financer leurs projets, en utilisant les NFT fractionnés comme garantie.
----

**Architecture du protocole**

1. Acteurs principaux

	-   Producteurs : Déposent un NFT représentant les droits de cession d’un film.
    
	-   Investisseurs : Achètent et stakent Seriecoin pour obtenir des fractions de NFT et percevoir des revenus futurs des droits.
    
	-   Protocole Seriecoin : Gère l’émission de Seriecoin, le fractionnement des NFT, les pools de liquidité, et les prêts en  USDC.
    

2. Composants techniques

	-   Blockchain : Ethereum (ou une L1/L2 compatible EVM comme Sonic ou Polygon pour des frais réduits).
    
	-   Seriecoin (SRC) : Jeton ERC-20 natif, adossé à EUROC (stablecoin euro) comme collatéral initial.
    
	-   NFT des droits d’auteur : Jeton ERC-721 unique, représentant la propriété des droits de cession d’un film.
    
	-   Fractions de NFT (fNFT) : Jetons ERC-20 créés à partir du NFT original, représentant des parts fractionnées (ex. 1 fNFT = 1 % des droits).
    
-   Smart contracts :
    
	    -   Emission de Seriecoin : Permet de mint Seriecoin contre EUROC déposé (ratio 1:1).
        
	    -   Fractionnement NFT : Verrouille le NFT et émet des fNFT dans un pool de liquidité.
        
	    -   Staking : Accepte le staking de Seriecoin pour distribuer des fNFT et des récompenses.
        
	    -   Prêt : Gère les emprunts en USDC contre les fNFT en collatéral.
        

3. Processus étape par étape

	1.  Émission de Seriecoin
    
	    -   Les investisseurs déposent EUROC dans un smart contract d’émission.
        
	    -   En retour, ils reçoivent une quantité équivalente de Seriecoin (SRC), par exemple 1 EUROC = 1 SRC.
        
	    -   Ces EUROC sont verrouillés comme collatéral pour garantir la stabilité de SRC.
        
	2.  Dépôt du NFT par le producteur
    
	    -   Un producteur crée un NFT (ERC-721) représentant 100 % des droits de cession de son film (ex. royalties sur les ventes/streaming).
        
	    -   Il dépose ce NFT dans un smart contract de fractionnement.
        
	    -   Le contrat verrouille le NFT et mint 100  000 fNFT (par exemple), chaque fNFT 1 % des droits.
        
	3.  Création du pool de liquidité
    
	    -   Les fNFT sont placés dans un pool de liquidité (ex. sur Uniswap ou un AMM personnalisé).
        
	    -   Le pool est initialement alimenté par une paire fNFT/Seriecoin, avec une liquidité fournie par le protocole ou des investisseurs initiaux.
        
	    -   Valeur initiale : estimée selon les revenus projetés du film (ex. 100 000 € = 100 000 SRC = 100  000 fNFT à 1 SRC chacun).
        
	4.  Staking de Seriecoin
    
	    -   Les investisseurs stakent leurs SRC dans un contrat de staking dédié.
        
	    -   En échange, ils reçoivent des fNFT proportionnels à leur mise (ex. 100 SRC stakés = 100  fNFT).
        
	    -   Les fNFT donnent droit à une part des revenus futurs du film (royalties versées en EUROC ou USDC).
        
	5.  Emprunt en USDC par le producteur
    
	    -   Le producteur utilise les fNFT verrouillés dans le pool comme collatéral pour emprunter des USDC via un contrat de prêt (inspiré d’Aave).
        
	    -   Montant empruntable : jusqu’à 70 % de la valeur des fNFT (surcharge collatérale pour réduire les risques). Ex. : 100 000 SRC de fNFT = 70 000 USDC empruntés.
        
	    -   Les USDC sont tirés d’un pool de prêt alimenté par des prêteurs externes (qui gagnent des intérêts).
        
	6.  Remboursement et revenus
    
	    -   Le producteur rembourse son prêt en USDC (principal + intérêts, ex. 5 % annuels).
        
	    -   Les revenus du film (ex. streaming) sont convertis en EUROC/USDC et redistribués :
        
	        -   Une part rembourse le prêt.
            
	        -   Le reste est versé aux détenteurs de fNFT via le pool ou un contrat de distribution.