// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";
import {CityLib} from "../src/libraries/CityLib.sol";
import {PositionLib} from "../src/libraries/PositionLib.sol";
import {MockConditionalTokens} from "./mocks/MockConditionalTokens.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

/// @title MarketResolutionTest
/// @notice Tests for market resolution functionality and CityLib
contract MarketResolutionTest is Test {
    MarketFactory public factory;
    MockConditionalTokens public ctf;
    MockUSDC public usdc;

    address public owner;
    address public alice = makeAddr("alice");
    address public nonOwner = makeAddr("nonOwner");

    bytes32 public questionId = keccak256("Will it rain in NYC tomorrow?");
    uint256 public resolutionTime;

    PredictionMarket public market;
    bytes32 public conditionId;

    function setUp() public {
        // Set owner as test contract
        owner = address(this);

        // Deploy mocks
        ctf = new MockConditionalTokens();
        usdc = new MockUSDC();

        // Deploy factory (owner is this test contract)
        factory = new MarketFactory(address(ctf), address(usdc));

        // Set resolution time to 1 day from now
        resolutionTime = block.timestamp + 1 days;

        // Create a market for testing
        address marketAddr = factory.createMarket(questionId, resolutionTime);
        market = PredictionMarket(marketAddr);

        // Calculate condition ID
        conditionId = PositionLib.getConditionId(address(factory), questionId, 2);

        // Fund alice
        usdc.mint(alice, 1000e6); // 1000 USDC

        // Alice approves market
        vm.prank(alice);
        usdc.approve(address(market), type(uint256).max);

        // Alice approves CTF
        vm.prank(alice);
        ctf.setApprovalForAll(address(market), true);
    }

    // ========== Resolution Tests ==========

    function test_resolveMarket_YesWins() public {
        // Alice buys YES shares
        vm.prank(alice);
        market.buy(100e6, true);

        // Verify market is not resolved yet
        assertFalse(market.resolved());

        // Prepare payouts: YES wins
        uint256[] memory payouts = new uint256[](2);
        payouts[0] = 1; // YES
        payouts[1] = 0; // NO

        // Resolve market (as owner)
        factory.resolveMarket(conditionId, payouts);

        // Verify market is resolved
        assertTrue(market.resolved());

        // Verify CTF payoutDenominator is set (condition resolved)
        assertEq(ctf.payoutDenominator(conditionId), 1);

        // Verify further buy() calls revert
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AlreadyResolved.selector);
        market.buy(10e6, true);
    }

    function test_resolveMarket_NoWins() public {
        // Alice buys NO shares
        vm.prank(alice);
        market.buy(100e6, false);

        // Verify market is not resolved yet
        assertFalse(market.resolved());

        // Prepare payouts: NO wins
        uint256[] memory payouts = new uint256[](2);
        payouts[0] = 0; // YES
        payouts[1] = 1; // NO

        // Resolve market (as owner)
        factory.resolveMarket(conditionId, payouts);

        // Verify market is resolved
        assertTrue(market.resolved());

        // Verify CTF payoutDenominator is set (condition resolved)
        assertEq(ctf.payoutDenominator(conditionId), 1);

        // Verify further buy() calls revert
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AlreadyResolved.selector);
        market.buy(10e6, false);
    }

    function test_resolveMarket_onlyOwner() public {
        // Prepare payouts
        uint256[] memory payouts = new uint256[](2);
        payouts[0] = 1;
        payouts[1] = 0;

        // Non-owner tries to resolve
        vm.prank(nonOwner);
        vm.expectRevert(
            abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner)
        );
        factory.resolveMarket(conditionId, payouts);

        // Verify market is still not resolved
        assertFalse(market.resolved());
    }

    function test_resolveMarket_marketNotFound() public {
        // Create a fake condition ID that doesn't exist
        bytes32 fakeConditionId = keccak256("nonexistent");

        // Prepare payouts
        uint256[] memory payouts = new uint256[](2);
        payouts[0] = 1;
        payouts[1] = 0;

        // Try to resolve non-existent market
        vm.expectRevert(MarketFactory.MarketNotFound.selector);
        factory.resolveMarket(fakeConditionId, payouts);
    }

    function test_resolveMarket_cannotResolveAgain() public {
        // Prepare payouts
        uint256[] memory payouts = new uint256[](2);
        payouts[0] = 1;
        payouts[1] = 0;

        // Resolve market first time
        factory.resolveMarket(conditionId, payouts);
        assertTrue(market.resolved());

        // Try to resolve again - should revert from CTF
        vm.expectRevert("Already resolved");
        factory.resolveMarket(conditionId, payouts);
    }

    function test_resolveMarket_blocksSells() public {
        // Alice buys YES and NO shares
        vm.startPrank(alice);
        market.buy(100e6, true);
        market.buy(100e6, false);
        vm.stopPrank();

        // Resolve market
        uint256[] memory payouts = new uint256[](2);
        payouts[0] = 1;
        payouts[1] = 0;
        factory.resolveMarket(conditionId, payouts);

        // Verify sell() is also blocked
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.AlreadyResolved.selector);
        market.sell(10e6, true);
    }

    // ========== CityLib Tests ==========

    function test_CityLib_allCities() public pure {
        // Test NYC
        CityLib.City memory nyc = CityLib.getCity(CityLib.CityId.NYC);
        assertEq(nyc.name, "New York City");
        assertEq(nyc.lat, 407128); // 40.7128 scaled by 10000
        assertEq(nyc.lon, -740060); // -74.0060 scaled by 10000

        // Test Chicago
        CityLib.City memory chicago = CityLib.getCity(CityLib.CityId.CHICAGO);
        assertEq(chicago.name, "Chicago");
        assertEq(chicago.lat, 418781); // 41.8781
        assertEq(chicago.lon, -876298); // -87.6298

        // Test Miami
        CityLib.City memory miami = CityLib.getCity(CityLib.CityId.MIAMI);
        assertEq(miami.name, "Miami");
        assertEq(miami.lat, 257617); // 25.7617
        assertEq(miami.lon, -801918); // -80.1918

        // Test Austin
        CityLib.City memory austin = CityLib.getCity(CityLib.CityId.AUSTIN);
        assertEq(austin.name, "Austin");
        assertEq(austin.lat, 302672); // 30.2672
        assertEq(austin.lon, -977431); // -97.7431
    }

    function test_CityLib_getCityCount() public pure {
        assertEq(CityLib.getCityCount(), 4);
    }
}
