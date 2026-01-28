// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Vault} from "../src/Vault.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {SimpleConditionalTokens} from "../src/SimpleConditionalTokens.sol";

/// @title DeployScript
/// @notice Deploys all prediction market contracts to Base Sepolia
/// @dev Run with: forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify -vvvv
contract DeployScript is Script {
    // Base Sepolia USDC address (Circle's official testnet USDC)
    address constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer address:", deployer);
        console.log("Deploying to Base Sepolia (chainId 84532)");
        console.log("-------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Vault for USDC custody
        Vault vault = new Vault(USDC);
        console.log("Vault deployed at:", address(vault));

        // 2. Deploy SimpleConditionalTokens (CTF implementation)
        // Note: Gnosis CTF is not deployed on Base Sepolia, so we use our simplified version
        SimpleConditionalTokens ctf = new SimpleConditionalTokens();
        console.log("SimpleConditionalTokens deployed at:", address(ctf));

        // 3. Deploy MarketFactory
        MarketFactory factory = new MarketFactory(address(ctf), USDC);
        console.log("MarketFactory deployed at:", address(factory));

        // 4. Create a test market (7 days from now)
        bytes32 questionId = keccak256(abi.encodePacked("Will it rain in NYC tomorrow?", block.timestamp));
        uint256 resolutionTime = block.timestamp + 7 days;

        address testMarket = factory.createMarket(questionId, resolutionTime);
        console.log("Test market created at:", testMarket);

        vm.stopBroadcast();

        console.log("-------------------------------------------");
        console.log("Deployment complete!");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  Vault:", address(vault));
        console.log("  SimpleConditionalTokens:", address(ctf));
        console.log("  MarketFactory:", address(factory));
        console.log("  Test Market:", testMarket);
        console.log("  USDC:", USDC);
    }
}
