// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimplePropertyToken is ERC20, Ownable {
    struct PropertyDetails {
        string propertyId;
        string propertyAddress;
        string cadastralRegistry;
        uint256 totalValue;
        uint256 totalTokens;
        bool isActive;
        string documentHash;
    }

    PropertyDetails public propertyDetails;
    
    mapping(address => uint256) public investorShares;
    mapping(address => bool) public kycVerified;
    
    event PropertyTokenized(
        string indexed propertyId,
        uint256 totalValue,
        uint256 totalTokens
    );
    
    event SharesPurchased(
        address indexed investor,
        uint256 amount,
        uint256 price
    );

    event KYCUpdated(address indexed investor, bool status);

    constructor(
        string memory _name,
        string memory _symbol,
        PropertyDetails memory _propertyDetails
    ) ERC20(_name, _symbol) Ownable() {
        propertyDetails = _propertyDetails;
        emit PropertyTokenized(
            _propertyDetails.propertyId,
            _propertyDetails.totalValue,
            _propertyDetails.totalTokens
        );
    }

    function updateKYC(address investor, bool status) external onlyOwner {
        kycVerified[investor] = status;
        emit KYCUpdated(investor, status);
    }

    function purchaseShares(address investor, uint256 amount) external onlyOwner {
        require(propertyDetails.isActive, "Property is not active");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= propertyDetails.totalTokens, "Exceeds total tokens");
        require(kycVerified[investor], "Investor not KYC verified");
        
        _mint(investor, amount);
        investorShares[investor] += amount;
        
        emit SharesPurchased(investor, amount, propertyDetails.totalValue * amount / propertyDetails.totalTokens);
    }

    function updatePropertyStatus(bool _isActive) external onlyOwner {
        propertyDetails.isActive = _isActive;
    }

    function getInvestorShares(address investor) external view returns (uint256) {
        return investorShares[investor];
    }

    function getPropertyValue() external view returns (uint256) {
        return propertyDetails.totalValue;
    }

    function getAvailableTokens() external view returns (uint256) {
        return propertyDetails.totalTokens - totalSupply();
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        require(kycVerified[to], "Recipient not KYC verified");
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(kycVerified[to], "Recipient not KYC verified");
        return super.transferFrom(from, to, amount);
    }
}