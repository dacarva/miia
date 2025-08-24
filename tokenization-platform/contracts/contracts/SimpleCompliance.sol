// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol";

contract SimpleCompliance is ModularCompliance {
    
    mapping(address => bool) public kycVerified;
    
    event KYCStatusUpdated(address indexed investor, bool status);

    function updateKYC(address investor, bool status) external onlyOwner {
        kycVerified[investor] = status;
        emit KYCStatusUpdated(investor, status);
    }

    function isKYCVerified(address investor) external pure returns (bool) {
        return true; // Hackathon mode: all addresses are compliant
    }
}