// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "./PropertyToken.sol";
import "./PropertyTokenFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PortfolioTracker is Ownable {
    
    struct Investment {
        string propertyId;
        address tokenAddress;
        uint256 tokenAmount;
        uint256 purchasePrice;
        uint256 purchaseTimestamp;
        bool isActive;
    }
    
    struct PortfolioSummary {
        uint256 totalInvestments;
        uint256 totalValue;
        uint256 totalTokens;
        uint256 activeProperties;
        uint256 totalReturns;
    }
    
    mapping(address => Investment[]) public investorPortfolios;
    mapping(address => mapping(string => uint256)) public investorPropertyIndex;
    mapping(string => address[]) public propertyInvestors;
    
    PropertyTokenFactory public immutable tokenFactory;
    
    event InvestmentAdded(
        address indexed investor,
        string indexed propertyId,
        uint256 tokenAmount,
        uint256 purchasePrice
    );
    
    event InvestmentUpdated(
        address indexed investor,
        string indexed propertyId,
        uint256 newTokenAmount
    );
    
    event ReturnsDistributed(
        string indexed propertyId,
        uint256 totalAmount,
        uint256 investorCount
    );

    constructor(address _tokenFactory) {
        tokenFactory = PropertyTokenFactory(_tokenFactory);
    }

    function addInvestment(
        address investor,
        string memory propertyId,
        uint256 tokenAmount,
        uint256 purchasePrice
    ) external {
        PropertyTokenFactory.TokenDeployment memory deployment = tokenFactory.getTokenDeployment(propertyId);
        require(deployment.tokenAddress != address(0), "Property token does not exist");
        
        PropertyToken token = PropertyToken(deployment.tokenAddress);
        require(msg.sender == deployment.tokenAddress || msg.sender == owner(), "Not authorized");
        
        uint256 existingIndex = investorPropertyIndex[investor][propertyId];
        
        if (existingIndex == 0 && (investorPortfolios[investor].length == 0 || 
            keccak256(abi.encodePacked(investorPortfolios[investor][0].propertyId)) != 
            keccak256(abi.encodePacked(propertyId)))) {
            
            // New investment
            Investment memory newInvestment = Investment({
                propertyId: propertyId,
                tokenAddress: deployment.tokenAddress,
                tokenAmount: tokenAmount,
                purchasePrice: purchasePrice,
                purchaseTimestamp: block.timestamp,
                isActive: true
            });
            
            investorPortfolios[investor].push(newInvestment);
            investorPropertyIndex[investor][propertyId] = investorPortfolios[investor].length;
            propertyInvestors[propertyId].push(investor);
            
            emit InvestmentAdded(investor, propertyId, tokenAmount, purchasePrice);
        } else {
            // Update existing investment
            uint256 index = existingIndex > 0 ? existingIndex - 1 : 0;
            investorPortfolios[investor][index].tokenAmount += tokenAmount;
            investorPortfolios[investor][index].purchasePrice += purchasePrice;
            
            emit InvestmentUpdated(investor, propertyId, investorPortfolios[investor][index].tokenAmount);
        }
    }

    function getInvestorPortfolio(address investor) external view returns (Investment[] memory) {
        return investorPortfolios[investor];
    }

    function getPortfolioSummary(address investor) external view returns (PortfolioSummary memory) {
        Investment[] memory investments = investorPortfolios[investor];
        
        uint256 totalInvestments = investments.length;
        uint256 totalValue = 0;
        uint256 totalTokens = 0;
        uint256 activeProperties = 0;
        uint256 totalReturns = 0;
        
        for (uint256 i = 0; i < investments.length; i++) {
            if (investments[i].isActive) {
                activeProperties++;
                totalTokens += investments[i].tokenAmount;
                
                PropertyToken token = PropertyToken(investments[i].tokenAddress);
                uint256 currentValue = (token.getPropertyValue() * investments[i].tokenAmount) / 
                                     (10 ** token.decimals());
                totalValue += currentValue;
                
                if (currentValue > investments[i].purchasePrice) {
                    totalReturns += (currentValue - investments[i].purchasePrice);
                }
            }
        }
        
        return PortfolioSummary({
            totalInvestments: totalInvestments,
            totalValue: totalValue,
            totalTokens: totalTokens,
            activeProperties: activeProperties,
            totalReturns: totalReturns
        });
    }

    function getPropertyInvestors(string memory propertyId) external view returns (address[] memory) {
        return propertyInvestors[propertyId];
    }

    function getInvestmentDetails(
        address investor,
        string memory propertyId
    ) external view returns (Investment memory) {
        uint256 index = investorPropertyIndex[investor][propertyId];
        require(index > 0, "Investment not found");
        return investorPortfolios[investor][index - 1];
    }

    function updateInvestmentStatus(
        address investor,
        string memory propertyId,
        bool isActive
    ) external onlyOwner {
        uint256 index = investorPropertyIndex[investor][propertyId];
        require(index > 0, "Investment not found");
        investorPortfolios[investor][index - 1].isActive = isActive;
    }

    function getInvestorCount(string memory propertyId) external view returns (uint256) {
        return propertyInvestors[propertyId].length;
    }

    function getTotalInvestmentValue(string memory propertyId) external view returns (uint256) {
        PropertyTokenFactory.TokenDeployment memory deployment = tokenFactory.getTokenDeployment(propertyId);
        require(deployment.tokenAddress != address(0), "Property token does not exist");
        
        PropertyToken token = PropertyToken(deployment.tokenAddress);
        return token.totalSupply() * token.getPropertyValue() / (10 ** token.decimals());
    }

    function simulateReturnsDistribution(
        string memory propertyId,
        uint256 totalAmount
    ) external view returns (address[] memory investors, uint256[] memory amounts) {
        address[] memory propertyInvestorsList = propertyInvestors[propertyId];
        investors = new address[](propertyInvestorsList.length);
        amounts = new uint256[](propertyInvestorsList.length);
        
        PropertyTokenFactory.TokenDeployment memory deployment = tokenFactory.getTokenDeployment(propertyId);
        PropertyToken token = PropertyToken(deployment.tokenAddress);
        uint256 totalSupply = token.totalSupply();
        
        for (uint256 i = 0; i < propertyInvestorsList.length; i++) {
            investors[i] = propertyInvestorsList[i];
            uint256 investorBalance = token.balanceOf(propertyInvestorsList[i]);
            amounts[i] = (totalAmount * investorBalance) / totalSupply;
        }
        
        return (investors, amounts);
    }
}