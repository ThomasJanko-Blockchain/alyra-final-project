// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// @title Lending
// @notice Contrat pour la création de prêts
contract Lending is Ownable(msg.sender) {
    using SafeERC20 for IERC20;

    IERC20 public usdcToken;
    IERC20 public fNFTToken;
    uint256 public collateralFactor; // e.g., 70 means 70%
    uint256 public annualInterestRate; // e.g., 5 means 5%
    uint256 public loanDuration; // in seconds

    struct Loan {
        uint256 principal;
        uint256 interest;
        uint256 startTime;
        uint256 endTime;
        bool repaid;
    }

    mapping(address => Loan) public loans;

    event LoanIssued(address indexed borrower, uint256 principal, uint256 interest, uint256 startTime, uint256 endTime);
    event LoanRepaid(address indexed borrower, uint256 amount, uint256 repaidAt);

    // @dev Constructeur: initialise le contrat avec les paramètres du prêt
    constructor(
        address _usdcToken,
        address _fNFTToken,
        uint256 _collateralFactor,
        uint256 _annualInterestRate,
        uint256 _loanDuration
    ) {
        usdcToken = IERC20(_usdcToken);
        fNFTToken = IERC20(_fNFTToken);
        collateralFactor = _collateralFactor;
        annualInterestRate = _annualInterestRate;
        loanDuration = _loanDuration;
    }

    // @dev Fonction pour déposer une garantie et emprunter
    function depositCollateralAndBorrow(uint256 collateralAmount) external {

        require(loans[msg.sender].principal == 0, "Existing loan must be repaid first");
        require(collateralAmount > 0, "Collateral amount must be greater than zero");

        // Transfer fNFTs from borrower to contract
        fNFTToken.safeTransferFrom(msg.sender, address(this), collateralAmount);

        // Calculate loan principal and interest
        uint256 loanPrincipal = (collateralAmount * collateralFactor) / 100;
        uint256 loanInterest = (loanPrincipal * annualInterestRate * loanDuration) / (365 days * 100);

        // Record loan details
        loans[msg.sender] = Loan({
            principal: loanPrincipal,
            interest: loanInterest,
            startTime: block.timestamp,
            endTime: block.timestamp + loanDuration,
            repaid: false
        });

        // Transfer USDC to borrower
        usdcToken.safeTransfer(msg.sender, loanPrincipal);

        emit LoanIssued(msg.sender, loanPrincipal, loanInterest, block.timestamp, block.timestamp + loanDuration);
    }

    // @dev Fonction pour rembourser un prêt
    function repayLoan() external {
        Loan storage loan = loans[msg.sender];
        require(loan.principal > 0, "No active loan found");
        require(!loan.repaid, "Loan already repaid");
        require(block.timestamp <= loan.endTime, "Loan has matured");

        uint256 totalRepayment = loan.principal + loan.interest;

        // Transfer USDC from borrower to contract
        usdcToken.safeTransferFrom(msg.sender, address(this), totalRepayment);

        // Mark loan as repaid
        loan.repaid = true;

        // Return collateral to borrower
        fNFTToken.safeTransfer(msg.sender, (loan.principal * 100) / collateralFactor);

        emit LoanRepaid(msg.sender, totalRepayment, block.timestamp);
    }

    // @dev Fonction pour liquider un prêt
    function liquidateLoan(address borrower) external onlyOwner {
        Loan storage loan = loans[borrower];
        require(loan.principal > 0, "No active loan found");
        require(!loan.repaid, "Loan already repaid");
        require(block.timestamp > loan.endTime, "Loan has not matured yet");

        // Transfer collateral to contract owner
        fNFTToken.safeTransfer(owner(), (loan.principal * 100) / collateralFactor);

        // Mark loan as repaid
        loan.repaid = true;
    }
}
