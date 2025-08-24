// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "./PropertyToken.sol";
import "./SimpleCompliance.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HackathonPropertyFactory is Ownable {
    
    struct PropertyDeployment {
        address tokenAddress;
        address complianceAddress;
        string propertyId;
        uint256 deploymentTime;
        bool isActive;
    }
    
    mapping(string => PropertyDeployment) public deployedTokens;
    mapping(address => string[]) public issuerTokens;
    
    // Shared infrastructure (passed in constructor)
    address public immutable trustedIssuersRegistry;
    address public immutable claimTopicsRegistry;
    address public immutable identityRegistry;
    
    event PropertyTokenCreated(
        string indexed propertyId,
        address indexed tokenAddress,
        address indexed issuer,
        address complianceAddress,
        string name,
        string symbol
    );

    constructor(
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry,
        address _identityRegistry
    ) Ownable() {
        trustedIssuersRegistry = _trustedIssuersRegistry;
        claimTopicsRegistry = _claimTopicsRegistry;
        identityRegistry = _identityRegistry;
    }

    function createPropertyToken(
        string memory propertyId,
        string memory name,
        string memory symbol,
        PropertyToken.PropertyDetails memory propertyDetails,
        address onchainID
    ) external returns (address) {
        require(bytes(propertyId).length > 0, "Property ID cannot be empty");
        require(deployedTokens[propertyId].tokenAddress == address(0), "Token already exists");
        
        // Deploy dedicated compliance for this property
        SimpleCompliance compliance = new SimpleCompliance();
        compliance.init();
        
        // Deploy property token
        PropertyToken token = new PropertyToken();
        
        // Initialize the T-REX token with dedicated compliance but shared identity registry
        token.init(
            identityRegistry,
            address(compliance),
            name,
            symbol,
            18,
            onchainID
        );
        
        // Initialize property details
        token.initializeProperty(propertyDetails);
        
        // Transfer ownership of components to the issuer
        compliance.transferOwnership(msg.sender);
        token.transferOwnership(msg.sender);
        
        // Store deployment info
        deployedTokens[propertyId] = PropertyDeployment({
            tokenAddress: address(token),
            complianceAddress: address(compliance),
            propertyId: propertyId,
            deploymentTime: block.timestamp,
            isActive: true
        });
        
        issuerTokens[msg.sender].push(propertyId);
        
        emit PropertyTokenCreated(
            propertyId,
            address(token),
            msg.sender,
            address(compliance),
            name,
            symbol
        );
        
        return address(token);
    }

    function getTokenAddress(string memory propertyId) external view returns (address) {
        return deployedTokens[propertyId].tokenAddress;
    }

    function getPropertyDeployment(string memory propertyId) external view returns (PropertyDeployment memory) {
        return deployedTokens[propertyId];
    }

    function getIssuerTokens(address issuer) external view returns (string[] memory) {
        return issuerTokens[issuer];
    }
}