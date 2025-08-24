// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@tokenysolutions/t-rex/contracts/token/Token.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PropertyToken is Token {
    // Colombian COP Mock Token interface
    IERC20 public colombianCOP;
    
    // Events
    event PropertyTokenized(
        string indexed propertyId,
        string title,
        uint256 totalValue,
        uint256 totalTokens,
        string neighborhood,
        string cityName
    );
    
    event SharesPurchased(
        address indexed investor,
        uint256 amount,
        uint256 price,
        uint256 ownershipPercentage,
        uint256 copPaid
    );

    struct PropertyDetails {
        // Core identification
        string propertyId;           // web_id from JSON (e.g., "18544-M5526040")
        string title;                // Property title
        
        // Location information
        string neighborhood;         // Neighborhood name
        string cityName;            // City name
        
        // Property characteristics
        string propertyType;        // apartamento, apartaestudio, casa, etc.
        
        // Physical characteristics
        uint256 area;               // Total area in m²
        
        // Financial information
        uint256 saleValue;          // Sale value in COP
        uint256 totalValue;         // Total tokenization value
        uint256 totalTokens;        // Total number of tokens
        
        // Tokenization status
        bool isActive;              // Whether the property is active for investment
        uint256 tokenizationDate;   // When the property was tokenized
    }

    PropertyDetails public propertyDetails;
    
    mapping(address => uint256) public investorShares;

    // This function will be called after deployment by the factory
    function initializeProperty(
        PropertyDetails memory _propertyDetails
    ) external {
        require(bytes(propertyDetails.propertyId).length == 0, "Already initialized");
        require(_propertyDetails.totalValue > 0, "Total value must be greater than 0");
        require(_propertyDetails.totalTokens > 0, "Total tokens must be greater than 0");
        require(bytes(_propertyDetails.propertyId).length > 0, "Property ID is required");
        
        propertyDetails = _propertyDetails;
        propertyDetails.tokenizationDate = block.timestamp;
        
        emit PropertyTokenized(
            _propertyDetails.propertyId,
            _propertyDetails.title,
            _propertyDetails.totalValue,
            _propertyDetails.totalTokens,
            _propertyDetails.neighborhood,
            _propertyDetails.cityName
        );
    }

    /**
     * @dev Set the Colombian COP token address
     * @param _colombianCOP The address of the Colombian COP mock token
     */
    function setColombianCOP(address _colombianCOP) external onlyAgent {
        require(_colombianCOP != address(0), "Invalid COP token address");
        colombianCOP = IERC20(_colombianCOP);
    }





    /**
     * @dev Purchase property shares using Colombian COP tokens (simplified for investor)
     * @param amount The number of property tokens to purchase
     * @param copAmount The amount of COP tokens to pay (in wei)
     */
    function buyShares(uint256 amount, uint256 copAmount) external {
        require(propertyDetails.isActive, "Property is not active");
        require(amount > 0, "Amount must be greater than 0");
        require(this.totalSupply() + amount <= propertyDetails.totalTokens, "Exceeds total tokens");
        require(address(colombianCOP) != address(0), "Colombian COP token not set");
        
        // Calculate required COP amount based on property value
        uint256 requiredCOPAmount = (propertyDetails.saleValue * amount) / propertyDetails.totalTokens;
        require(copAmount >= requiredCOPAmount, "Insufficient COP payment");
        
        // Transfer COP tokens from investor to this contract
        require(colombianCOP.transferFrom(msg.sender, address(this), copAmount), "COP transfer failed");
        
        // Mint property tokens to investor (using internal mint)
        _mint(msg.sender, amount);
        investorShares[msg.sender] += amount;
        
        uint256 price = propertyDetails.totalValue * amount / propertyDetails.totalTokens;
        uint256 ownershipPercentage = (amount * 10000) / propertyDetails.totalTokens; // Basis points (10000 = 100%)
        
        emit SharesPurchased(msg.sender, amount, price, ownershipPercentage, copAmount);
    }

    /**
     * @dev Get the required COP amount for purchasing a specific number of tokens
     * @param amount The number of property tokens to purchase
     * @return The required COP amount in wei
     */
    function getRequiredCOPAmount(uint256 amount) external view returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= propertyDetails.totalTokens, "Amount exceeds total tokens");
        return (propertyDetails.saleValue * amount) / propertyDetails.totalTokens;
    }

    /**
     * @dev Get the required COP amount in COP units (not wei)
     * @param amount The number of property tokens to purchase
     * @return The required COP amount in COP units
     */
    function getRequiredCOPAmountInCOP(uint256 amount) external view returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= propertyDetails.totalTokens, "Amount exceeds total tokens");
        uint256 weiAmount = (propertyDetails.saleValue * amount) / propertyDetails.totalTokens;
        return weiAmount / 1e12; // Convert from wei to COP units
    }

    function updatePropertyStatus(bool _isActive) external onlyAgent {
        propertyDetails.isActive = _isActive;
    }

    function updatePropertyDetails(
        string memory _title,
        uint256 _saleValue
    ) external onlyAgent {
        propertyDetails.title = _title;
        propertyDetails.saleValue = _saleValue;
    }



    function getPropertyDetails() external view returns (
        string memory propertyId,
        string memory title,
        string memory neighborhood,
        string memory cityName,
        string memory propertyType,
        uint256 area,
        uint256 saleValue,
        uint256 totalValue,
        uint256 totalTokens,
        bool isActive
    ) {
        return (
            propertyDetails.propertyId,
            propertyDetails.title,
            propertyDetails.neighborhood,
            propertyDetails.cityName,
            propertyDetails.propertyType,
            propertyDetails.area,
            propertyDetails.saleValue,
            propertyDetails.totalValue,
            propertyDetails.totalTokens,
            propertyDetails.isActive
        );
    }

    function getTokenPrice() external view returns (uint256) {
        return propertyDetails.totalValue / propertyDetails.totalTokens;
    }

    function getInvestorOwnershipPercentage(address investor) external view returns (uint256) {
        uint256 shares = investorShares[investor];
        if (shares == 0) return 0;
        return (shares * 10000) / propertyDetails.totalTokens; // Returns basis points (10000 = 100%)
    }
}