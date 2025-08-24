const hre = require("hardhat");

// Helper function to wait
const wait = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

async function main() {
  console.log("🚀 Deploying Colombian COP Mock Token (MCOP)...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Deploy Colombian COP Token
  console.log("\n💰 Deploying Colombian COP Mock Token...");
  
  const ColombianCOPFactory = await hre.ethers.getContractFactory("ColombianCOP");
  const colombianCOP = await ColombianCOPFactory.deploy();
  await colombianCOP.waitForDeployment();
  
  const tokenAddress = await colombianCOP.getAddress();
  console.log("   ✅ ColombianCOP deployed at:", tokenAddress);
  await wait(3);

  // Get token information
  const [name, symbol, decimals, totalSupply] = await colombianCOP.getTokenInfo();
  const totalSupplyCOP = await colombianCOP.totalSupplyCOP();
  const deployerBalance = await colombianCOP.balanceOf(deployer.address);
  const deployerBalanceCOP = await colombianCOP.balanceOfCOP(deployer.address);

  console.log("\n📊 Token Information:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log(`   Total Supply: ${hre.ethers.formatEther(totalSupply)} MCOP`);
  console.log(`   Total Supply (COP): ${totalSupplyCOP.toLocaleString()} COP`);
  console.log(`   Deployer Balance: ${hre.ethers.formatEther(deployerBalance)} MCOP`);
  console.log(`   Deployer Balance (COP): ${deployerBalanceCOP.toLocaleString()} COP`);

  // Demo minting functionality
  console.log("\n🎯 Testing Minting Functionality...");
  
  // Test minting 1 billion COP to deployer
  console.log("   🔄 Minting 1,000,000,000 COP to deployer...");
  await colombianCOP.mintCOPToSelf(1000000000); // 1 billion COP
  await wait(2);
  
  const newBalance = await colombianCOP.balanceOfCOP(deployer.address);
  console.log(`   ✅ New deployer balance: ${newBalance.toLocaleString()} COP`);

  // Test minting regular wei amount
  console.log("   🔄 Minting 1000 MCOP tokens (wei) to deployer...");
  await colombianCOP.mintToSelf(hre.ethers.parseEther("1000"));
  await wait(2);
  
  const finalBalance = await colombianCOP.balanceOf(deployer.address);
  console.log(`   ✅ Final deployer balance: ${hre.ethers.formatEther(finalBalance)} MCOP`);

  // Save deployment info
  const network = await hre.ethers.provider.getNetwork();
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    token: {
      name: name,
      symbol: symbol,
      decimals: Number(decimals),
      address: tokenAddress,
      totalSupply: totalSupply.toString(),
      totalSupplyCOP: totalSupplyCOP.toString()
    },
    features: {
      anyoneCanMint: true,
      mintCOPFunction: true,
      burnFunction: true,
      copBalanceView: true
    }
  };

  console.log("\n💾 Saving deployment information...");
  const fs = require('fs');
  const fileName = `colombian-cop-deployment-${hre.network.name}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deploymentInfo, null, 2));
  console.log(`   ✅ Deployment info saved to: ${fileName}`);

  console.log("\n🎉 === COLOMBIAN COP TOKEN DEPLOYED SUCCESSFULLY ===");
  console.log("📋 Summary:");
  console.log(`   Token Address: ${tokenAddress}`);
  console.log(`   Network: ${hre.network.name}`);
  console.log(`   Total Supply: 100 Trillion MCOP`);
  console.log(`   Features: Anyone can mint, COP conversion helpers, burn functions`);
  
  console.log("\n📖 Usage Examples:");
  console.log("   // Mint 1 million COP to address");
  console.log(`   await colombianCOP.mintCOP("0x...", 1000000);`);
  console.log("   ");
  console.log("   // Mint 1000 MCOP tokens (18 decimals)");
  console.log(`   await colombianCOP.mint("0x...", ethers.parseEther("1000"));`);
  console.log("   ");
  console.log("   // Check balance in COP");
  console.log(`   await colombianCOP.balanceOfCOP("0x...");`);

  console.log("\n🚀 Colombian COP Mock Token ready for testing!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
