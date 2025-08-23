// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "./PropertyToken.sol";
import "./SimpleCompliance.sol";
import "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistry.sol";
import "@tokenysolutions/t-rex/contracts/registry/implementation/TrustedIssuersRegistry.sol";
import "@tokenysolutions/t-rex/contracts/registry/implementation/ClaimTopicsRegistry.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyTokenFactory is Ownable {
    
    struct TokenDeployment {
        address tokenAddress;
        address identityRegistry;
        address compliance;
        string propertyId;
        uint256 deploymentTime;
        bool isActive;
    }
    
    mapping(string => TokenDeployment) public deployedTokens;
    mapping(address => string[]) public issuerTokens;
    
    address public trustedIssuersRegistry;
    address public claimTopicsRegistry;
    
    string[] public allPropertyIds;
    
    event PropertyTokenCreated(
        string indexed propertyId,
        address indexed tokenAddress,
        address indexed issuer,
        string name,
        string symbol
    );
    
    event TokenStatusUpdated(string indexed propertyId, bool isActive);

    constructor(
        address _trustedIssuersRegistry,
        address _claimTopicsRegistry
    ) Ownable() {
        trustedIssuersRegistry = _trustedIssuersRegistry;
        claimTopicsRegistry = _claimTopicsRegistry;
    }

    function createPropertyToken(
        string memory propertyId,
        string memory name,
        string memory symbol,
        PropertyToken.PropertyDetails memory propertyDetails,
        address onchainID
    ) external returns (address) {
        require(bytes(propertyId).length > 0, "Property ID cannot be empty");
        require(deployedTokens[propertyId].tokenAddress == address(0), "Token already exists for this property");
        require(propertyDetails.totalTokens > 0, "Total tokens must be greater than 0");
        require(propertyDetails.totalValue > 0, "Total value must be greater than 0");
        
        // Deploy Identity Registry
        IdentityRegistry identityRegistry = new IdentityRegistry();
        identityRegistry.init(trustedIssuersRegistry, claimTopicsRegistry, msg.sender);
        
        // Deploy Compliance
        SimpleCompliance compliance = new SimpleCompliance();
        
        // Deploy Property Token
        PropertyToken token = new PropertyToken();
        token.init(
            address(identityRegistry),
            address(compliance),
            name,
            symbol,
            18,
            onchainID
        );
        
        // Initialize property details
        token.initializeProperty(propertyDetails);
        
        // Setup permissions - transfer ownership to the issuer
        identityRegistry.transferOwnership(msg.sender);
        compliance.transferOwnership(msg.sender);
        token.transferOwnership(msg.sender);
        
        deployedTokens[propertyId] = TokenDeployment({
            tokenAddress: address(token),
            identityRegistry: address(identityRegistry),
            compliance: address(compliance),
            propertyId: propertyId,
            deploymentTime: block.timestamp,
            isActive: true
        });
        
        issuerTokens[msg.sender].push(propertyId);
        allPropertyIds.push(propertyId);
        
        emit PropertyTokenCreated(propertyId, address(token), msg.sender, name, symbol);
        
        return address(token);
    }

    function updateTokenStatus(string memory propertyId, bool isActive) external {
        TokenDeployment storage deployment = deployedTokens[propertyId];
        require(deployment.tokenAddress != address(0), "Token does not exist");
        
        PropertyToken token = PropertyToken(deployment.tokenAddress);
        require(token.owner() == msg.sender || msg.sender == owner(), "Not authorized");
        
        deployment.isActive = isActive;
        token.updatePropertyStatus(isActive);
        
        emit TokenStatusUpdated(propertyId, isActive);
    }

    function getTokenDeployment(string memory propertyId) external view returns (TokenDeployment memory) {
        return deployedTokens[propertyId];
    }

    function getIssuerTokens(address issuer) external view returns (string[] memory) {
        return issuerTokens[issuer];
    }

    function getAllPropertyIds() external view returns (string[] memory) {
        return allPropertyIds;
    }

    function getActiveTokensCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allPropertyIds.length; i++) {
            if (deployedTokens[allPropertyIds[i]].isActive) {
                count++;
            }
        }
        return count;
    }
}