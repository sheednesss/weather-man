// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Vault} from "../src/Vault.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {SimpleConditionalTokens} from "../src/SimpleConditionalTokens.sol";

/// @title MockUSDC
/// @notice Mock USDC for local testing
contract MockUSDC {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

/// @title DeployLocalScript
/// @notice Deploys all contracts to local Anvil for development
/// @dev Run with: forge script script/DeployLocal.s.sol:DeployLocalScript --rpc-url http://127.0.0.1:8545 --broadcast -vvvv
contract DeployLocalScript is Script {
    function run() external {
        // Use Anvil's default private key (account 0)
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer address:", deployer);
        console.log("Deploying to local Anvil");
        console.log("-------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock USDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // 2. Mint some USDC to deployer for testing
        usdc.mint(deployer, 1_000_000 * 1e6); // 1M USDC
        console.log("Minted 1M USDC to deployer");

        // 3. Deploy Vault
        Vault vault = new Vault(address(usdc));
        console.log("Vault deployed at:", address(vault));

        // 4. Deploy SimpleConditionalTokens
        SimpleConditionalTokens ctf = new SimpleConditionalTokens();
        console.log("SimpleConditionalTokens deployed at:", address(ctf));

        // 5. Deploy MarketFactory
        MarketFactory factory = new MarketFactory(address(ctf), address(usdc));
        console.log("MarketFactory deployed at:", address(factory));

        // 6. Create a test market
        bytes32 questionId = keccak256(abi.encodePacked("Will BTC hit 100k by end of month?", block.timestamp));
        uint256 resolutionTime = block.timestamp + 30 days;

        address testMarket = factory.createMarket(questionId, resolutionTime);
        console.log("Test market created at:", testMarket);

        vm.stopBroadcast();

        console.log("-------------------------------------------");
        console.log("Local deployment complete!");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  MockUSDC:", address(usdc));
        console.log("  Vault:", address(vault));
        console.log("  SimpleConditionalTokens:", address(ctf));
        console.log("  MarketFactory:", address(factory));
        console.log("  Test Market:", testMarket);
        console.log("");
        console.log("To interact:");
        console.log("  1. Start Anvil: anvil");
        console.log("  2. Run this script against Anvil");
        console.log("  3. Use cast to interact with contracts");
    }
}
