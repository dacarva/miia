// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "./PropertyToken.sol";
import "./PropertyTokenFactory.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionalPurchase is ReentrancyGuard, Ownable {
    
    struct PurchaseOrder {
        address investor;
        string propertyId;
        uint256 tokenAmount;
        uint256 pricePerToken;
        uint256 totalPrice;
        uint256 timestamp;
        bool isCompleted;
        bool isCancelled;
    }
    
    struct PropertyListing {
        string propertyId;
        address tokenAddress;
        uint256 availableTokens;
        uint256 pricePerToken;
        address issuer;
        bool isActive;
    }
    
    mapping(bytes32 => PurchaseOrder) public purchaseOrders;
    mapping(string => PropertyListing) public propertyListings;
    mapping(address => bytes32[]) public investorOrders;
    mapping(string => bytes32[]) public propertyOrders;
    
    PropertyTokenFactory public immutable tokenFactory;
    
    uint256 public platformFeePercentage = 250; // 2.5%
    address public feeRecipient;
    
    event PropertyListed(
        string indexed propertyId,
        address indexed tokenAddress,
        uint256 availableTokens,
        uint256 pricePerToken
    );
    
    event PurchaseOrderCreated(
        bytes32 indexed orderId,
        address indexed investor,
        string indexed propertyId,
        uint256 tokenAmount,
        uint256 totalPrice
    );
    
    event PurchaseCompleted(
        bytes32 indexed orderId,
        address indexed investor,
        string indexed propertyId,
        uint256 tokenAmount,
        uint256 totalPrice
    );
    
    event PurchaseRefunded(bytes32 indexed orderId, uint256 refundAmount);

    constructor(address _tokenFactory, address _feeRecipient) {
        tokenFactory = PropertyTokenFactory(_tokenFactory);
        feeRecipient = _feeRecipient;
    }

    function listPropertyForSale(
        string memory propertyId,
        uint256 availableTokens,
        uint256 pricePerToken
    ) external {
        PropertyTokenFactory.TokenDeployment memory deployment = tokenFactory.getTokenDeployment(propertyId);
        require(deployment.tokenAddress != address(0), "Property token does not exist");
        require(deployment.isActive, "Property token is not active");
        
        PropertyToken token = PropertyToken(deployment.tokenAddress);
        require(token.owner() == msg.sender, "Not the token owner");
        require(availableTokens > 0, "Available tokens must be greater than 0");
        require(pricePerToken > 0, "Price per token must be greater than 0");
        
        propertyListings[propertyId] = PropertyListing({
            propertyId: propertyId,
            tokenAddress: deployment.tokenAddress,
            availableTokens: availableTokens,
            pricePerToken: pricePerToken,
            issuer: msg.sender,
            isActive: true
        });
        
        emit PropertyListed(propertyId, deployment.tokenAddress, availableTokens, pricePerToken);
    }

    function createPurchaseOrder(
        string memory propertyId,
        uint256 tokenAmount
    ) external payable nonReentrant {
        PropertyListing memory listing = propertyListings[propertyId];
        require(listing.isActive, "Property not listed for sale");
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(tokenAmount <= listing.availableTokens, "Insufficient tokens available");
        
        uint256 totalPrice = tokenAmount * listing.pricePerToken;
        uint256 platformFee = (totalPrice * platformFeePercentage) / 10000;
        uint256 totalRequired = totalPrice + platformFee;
        
        require(msg.value >= totalRequired, "Insufficient payment");
        
        bytes32 orderId = keccak256(abi.encodePacked(
            msg.sender,
            propertyId,
            tokenAmount,
            block.timestamp,
            block.number
        ));
        
        purchaseOrders[orderId] = PurchaseOrder({
            investor: msg.sender,
            propertyId: propertyId,
            tokenAmount: tokenAmount,
            pricePerToken: listing.pricePerToken,
            totalPrice: totalPrice,
            timestamp: block.timestamp,
            isCompleted: false,
            isCancelled: false
        });
        
        investorOrders[msg.sender].push(orderId);
        propertyOrders[propertyId].push(orderId);
        
        // Update available tokens
        propertyListings[propertyId].availableTokens -= tokenAmount;
        
        emit PurchaseOrderCreated(orderId, msg.sender, propertyId, tokenAmount, totalPrice);
        
        // Execute purchase immediately
        _executePurchase(orderId);
        
        // Refund excess payment
        if (msg.value > totalRequired) {
            payable(msg.sender).transfer(msg.value - totalRequired);
        }
    }

    function _executePurchase(bytes32 orderId) internal {
        PurchaseOrder storage order = purchaseOrders[orderId];
        require(!order.isCompleted && !order.isCancelled, "Order already processed");
        
        PropertyListing memory listing = propertyListings[order.propertyId];
        PropertyToken token = PropertyToken(listing.tokenAddress);
        
        // Check if property is active
        require(token.getPropertyValue() > 0, "Property not properly initialized");
        
        // Mint tokens to investor
        token.purchaseShares(order.investor, order.tokenAmount);
        
        // Transfer payment to issuer (minus platform fee)
        uint256 platformFee = (order.totalPrice * platformFeePercentage) / 10000;
        uint256 issuerPayment = order.totalPrice - platformFee;
        
        payable(listing.issuer).transfer(issuerPayment);
        payable(feeRecipient).transfer(platformFee);
        
        order.isCompleted = true;
        
        emit PurchaseCompleted(orderId, order.investor, order.propertyId, 
                             order.tokenAmount, order.totalPrice);
    }

    function cancelPurchaseOrder(bytes32 orderId) external nonReentrant {
        PurchaseOrder storage order = purchaseOrders[orderId];
        require(order.investor == msg.sender, "Not the order owner");
        require(!order.isCompleted && !order.isCancelled, "Order already processed");
        
        uint256 platformFee = (order.totalPrice * platformFeePercentage) / 10000;
        uint256 refundAmount = order.totalPrice + platformFee;
        
        order.isCancelled = true;
        
        // Return available tokens to listing
        propertyListings[order.propertyId].availableTokens += order.tokenAmount;
        
        payable(msg.sender).transfer(refundAmount);
        
        emit PurchaseRefunded(orderId, refundAmount);
    }

    function updatePropertyListing(
        string memory propertyId,
        uint256 newAvailableTokens,
        uint256 newPricePerToken,
        bool isActive
    ) external {
        PropertyListing storage listing = propertyListings[propertyId];
        require(listing.issuer == msg.sender, "Not the property issuer");
        
        listing.availableTokens = newAvailableTokens;
        listing.pricePerToken = newPricePerToken;
        listing.isActive = isActive;
    }

    function getInvestorOrders(address investor) external view returns (bytes32[] memory) {
        return investorOrders[investor];
    }

    function getPropertyOrders(string memory propertyId) external view returns (bytes32[] memory) {
        return propertyOrders[propertyId];
    }

    function setPlatformFee(uint256 _platformFeePercentage) external onlyOwner {
        require(_platformFeePercentage <= 1000, "Fee cannot exceed 10%");
        platformFeePercentage = _platformFeePercentage;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }
}