// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@tokenysolutions/t-rex/contracts/token/Token.sol";

contract PropertyToken is Token {
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

    // This function will be called after deployment by the factory
    function initializeProperty(
        PropertyDetails memory _propertyDetails
    ) external {
        require(bytes(propertyDetails.propertyId).length == 0, "Already initialized");
        propertyDetails = _propertyDetails;
        emit PropertyTokenized(
            _propertyDetails.propertyId,
            _propertyDetails.totalValue,
            _propertyDetails.totalTokens
        );
    }

    function purchaseShares(address investor, uint256 amount) external onlyAgent {
        require(propertyDetails.isActive, "Property is not active");
        require(amount > 0, "Amount must be greater than 0");
        require(this.totalSupply() + amount <= propertyDetails.totalTokens, "Exceeds total tokens");
        
        mint(investor, amount);
        investorShares[investor] += amount;
        
        emit SharesPurchased(investor, amount, propertyDetails.totalValue * amount / propertyDetails.totalTokens);
    }

    function updatePropertyStatus(bool _isActive) external onlyAgent {
        propertyDetails.isActive = _isActive;
    }

    function getInvestorShares(address investor) external view returns (uint256) {
        return investorShares[investor];
    }

    function getPropertyValue() external view returns (uint256) {
        return propertyDetails.totalValue;
    }

    function getAvailableTokens() external view returns (uint256) {
        return propertyDetails.totalTokens - this.totalSupply();
    }
}