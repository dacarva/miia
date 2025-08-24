// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ColombianCOP (MCOP)
 * @dev Mock ERC20 token representing Colombian Pesos for testing purposes
 * @notice This is a test token - anyone can mint tokens for testing
 */
contract ColombianCOP is ERC20 {
    uint8 private _decimals;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    
    /**
     * @dev Constructor that gives msg.sender initial supply of tokens.
     * @notice Creates 100 trillion MCOP tokens (100,000,000,000,000)
     */
    constructor() ERC20("Colombian COP Mock", "MCOP") {
        _decimals = 18;
        
        // Mint 100 trillion tokens (100T) to the deployer
        uint256 initialSupply = 100_000_000_000_000 * 10**_decimals;
        _mint(msg.sender, initialSupply);
        
        emit TokensMinted(msg.sender, initialSupply);
    }
    
    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Allows anyone to mint tokens for testing purposes
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (in wei units)
     */
    function mint(address to, uint256 amount) external {
        require(to != address(0), "MCOP: cannot mint to zero address");
        require(amount > 0, "MCOP: amount must be greater than zero");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Allows anyone to mint tokens to themselves
     * @param amount The amount of tokens to mint (in wei units)
     */
    function mintToSelf(uint256 amount) external {
        require(amount > 0, "MCOP: amount must be greater than zero");
        
        _mint(msg.sender, amount);
        emit TokensMinted(msg.sender, amount);
    }
    
    /**
     * @dev Helper function to mint tokens with COP amount (6 decimals)
     * @param to The address to mint tokens to
     * @param copAmount The amount in COP (will be converted to 18 decimals)
     * @notice 1 COP = 1e12 wei (since COP typically has 0-2 decimals, we use 12 decimal shift)
     */
    function mintCOP(address to, uint256 copAmount) external {
        require(to != address(0), "MCOP: cannot mint to zero address");
        require(copAmount > 0, "MCOP: COP amount must be greater than zero");
        
        // Convert COP amount to wei (shift by 12 decimals to account for COP precision)
        uint256 weiAmount = copAmount * 1e12;
        
        _mint(to, weiAmount);
        emit TokensMinted(to, weiAmount);
    }
    
    /**
     * @dev Helper function to mint COP tokens to sender
     * @param copAmount The amount in COP (will be converted to 18 decimals)
     */
    function mintCOPToSelf(uint256 copAmount) external {
        require(copAmount > 0, "MCOP: COP amount must be greater than zero");
        
        // Convert COP amount to wei
        uint256 weiAmount = copAmount * 1e12;
        
        _mint(msg.sender, weiAmount);
        emit TokensMinted(msg.sender, weiAmount);
    }
    
    /**
     * @dev Burns tokens from the caller's balance
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external {
        require(amount > 0, "MCOP: amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "MCOP: burn amount exceeds balance");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Burns tokens from a specific address (requires allowance)
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) external {
        require(amount > 0, "MCOP: amount must be greater than zero");
        require(from != address(0), "MCOP: cannot burn from zero address");
        
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "MCOP: burn amount exceeds allowance");
        
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        
        emit TokensBurned(from, amount);
    }
    
    /**
     * @dev Returns the balance in COP units (divides by 1e12)
     * @param account The account to check balance for
     * @return The balance in COP units
     */
    function balanceOfCOP(address account) external view returns (uint256) {
        return balanceOf(account) / 1e12;
    }
    
    /**
     * @dev Returns the total supply in COP units
     * @return The total supply in COP units
     */
    function totalSupplyCOP() external view returns (uint256) {
        return totalSupply() / 1e12;
    }
    
    /**
     * @dev Emergency function to recover any ERC20 tokens sent to this contract
     * @param token The token contract address
     * @param amount The amount to recover
     */
    function recoverTokens(address token, uint256 amount) external {
        require(token != address(this), "MCOP: cannot recover MCOP tokens");
        require(token != address(0), "MCOP: invalid token address");
        
        IERC20(token).transfer(msg.sender, amount);
    }
    
    /**
     * @dev View function to get token information
     * @return name_ Token name
     * @return symbol_ Token symbol
     * @return decimals_ Token decimals
     * @return totalSupply_ Total supply
     */
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_
    ) {
        return (name(), symbol(), decimals(), totalSupply());
    }
}
