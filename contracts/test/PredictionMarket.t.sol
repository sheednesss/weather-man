// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";
import {PositionLib} from "../src/libraries/PositionLib.sol";
import {MockConditionalTokens} from "./mocks/MockConditionalTokens.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

/// @title PredictionMarketTest
/// @notice Comprehensive tests for PredictionMarket and MarketFactory
contract PredictionMarketTest is Test {
    MarketFactory public factory;
    MockConditionalTokens public ctf;
    MockUSDC public usdc;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    bytes32 public questionId = keccak256("Will ETH be above $5000 on Dec 31?");
    uint256 public resolutionTime;

    PredictionMarket public market;
    bytes32 public conditionId;

    function setUp() public {
        // Deploy mocks
        ctf = new MockConditionalTokens();
        usdc = new MockUSDC();

        // Deploy factory
        factory = new MarketFactory(address(ctf), address(usdc));

        // Set resolution time to 1 day from now
        resolutionTime = block.timestamp + 1 days;

        // Create a market for testing
        address marketAddr = factory.createMarket(questionId, resolutionTime);
        market = PredictionMarket(marketAddr);

        // Calculate condition ID for tests
        conditionId = PositionLib.getConditionId(address(factory), questionId, 2);

        // Fund test users
        usdc.mint(alice, 10_000e6); // 10,000 USDC
        usdc.mint(bob, 10_000e6);

        // Pre-approve market to spend USDC
        vm.prank(alice);
        usdc.approve(address(market), type(uint256).max);

        vm.prank(bob);
        usdc.approve(address(market), type(uint256).max);

        // Pre-approve market on CTF for token transfers
        vm.prank(alice);
        ctf.setApprovalForAll(address(market), true);

        vm.prank(bob);
        ctf.setApprovalForAll(address(market), true);
    }

    // ========== Factory Tests ==========

    function test_CreateMarket_EmitsEvent() public {
        bytes32 newQuestionId = keccak256("Will BTC reach $100k?");
        uint256 newResolutionTime = block.timestamp + 7 days;

        bytes32 expectedConditionId = PositionLib.getConditionId(
            address(factory),
            newQuestionId,
            2
        );

        // Check that the event is emitted with correct indexed params (conditionId)
        // We skip checking the market address since it's computed at deploy time
        vm.expectEmit(true, false, false, false);
        emit MarketFactory.MarketCreated(
            expectedConditionId,
            address(0), // placeholder - not checked
            newQuestionId,
            newResolutionTime
        );

        address newMarket = factory.createMarket(newQuestionId, newResolutionTime);
        assertTrue(newMarket != address(0), "Market should be created");
    }

    function test_CreateMarket_StoresInMapping() public {
        bytes32 newQuestionId = keccak256("Test question");
        address marketAddr = factory.createMarket(newQuestionId, block.timestamp + 1 days);

        bytes32 newConditionId = PositionLib.getConditionId(address(factory), newQuestionId, 2);
        assertEq(factory.getMarket(newConditionId), marketAddr);
    }

    function test_CreateMarket_RevertsIfAlreadyExists() public {
        vm.expectRevert(MarketFactory.MarketAlreadyExists.selector);
        factory.createMarket(questionId, resolutionTime);
    }

    function test_CreateMarket_RevertsIfResolutionTimePast() public {
        vm.expectRevert(MarketFactory.InvalidResolutionTime.selector);
        factory.createMarket(keccak256("past"), block.timestamp - 1);
    }

    // ========== Buy Tests ==========

    function test_Buy_Yes_ReceivesTokens() public {
        uint256 amount = 100e6; // 100 USDC
        uint256 aliceBalanceBefore = usdc.balanceOf(alice);

        vm.prank(alice);
        market.buy(amount, true); // Buy YES

        // Check USDC was transferred
        assertEq(usdc.balanceOf(alice), aliceBalanceBefore - amount);

        // Check alice received YES tokens
        uint256 yesBalance = market.getPositionBalance(alice, true);
        assertEq(yesBalance, amount);

        // Check yesPool increased
        assertEq(market.yesPool(), amount);
    }

    function test_Buy_No_ReceivesTokens() public {
        uint256 amount = 50e6; // 50 USDC

        vm.prank(bob);
        market.buy(amount, false); // Buy NO

        // Check bob received NO tokens
        uint256 noBalance = market.getPositionBalance(bob, false);
        assertEq(noBalance, amount);

        // Check noPool increased
        assertEq(market.noPool(), amount);
    }

    function test_Buy_RevertsOnZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ZeroAmount.selector);
        market.buy(0, true);
    }

    function test_Buy_MultipleBuysAccumulate() public {
        vm.startPrank(alice);
        market.buy(100e6, true);
        market.buy(50e6, true);
        vm.stopPrank();

        assertEq(market.getPositionBalance(alice, true), 150e6);
        assertEq(market.yesPool(), 150e6);
    }

    // ========== Sell Tests ==========

    function test_Sell_Yes_ReturnsUSDC() public {
        // First, alice and bob both need to buy for there to be opposite tokens
        vm.prank(alice);
        market.buy(100e6, true); // Alice buys YES

        vm.prank(bob);
        market.buy(100e6, false); // Bob buys NO

        // Market now holds: 100 YES tokens (alice's) + 100 NO tokens (bob's given to contract)
        // Actually, the market keeps the opposite tokens, so:
        // Alice has 100 YES, market has 100 NO
        // Bob has 100 NO, market has 100 YES

        // Alice sells her YES tokens
        uint256 aliceUsdcBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        market.sell(100e6, true);

        // Alice should receive USDC back
        uint256 aliceUsdcAfter = usdc.balanceOf(alice);
        assertEq(aliceUsdcAfter - aliceUsdcBefore, 100e6);

        // Alice's YES balance should be 0
        assertEq(market.getPositionBalance(alice, true), 0);
    }

    function test_Sell_RevertsIfNoPosition() public {
        // Alice hasn't bought anything
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.InsufficientShares.selector);
        market.sell(100e6, true);
    }

    function test_Sell_RevertsOnZeroAmount() public {
        vm.prank(alice);
        market.buy(100e6, true);

        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ZeroAmount.selector);
        market.sell(0, true);
    }

    // ========== Cost Basis Tests ==========

    function test_CostBasis_TrackedOnBuy() public {
        vm.prank(alice);
        market.buy(100e6, true);

        assertEq(market.getCostBasis(alice, true), 100e6);

        // Buy more
        vm.prank(alice);
        market.buy(50e6, true);

        // Cost basis should accumulate
        assertEq(market.getCostBasis(alice, true), 150e6);
    }

    function test_CostBasis_ReducedOnSell() public {
        // Setup: Alice buys YES, Bob buys NO
        vm.prank(alice);
        market.buy(100e6, true);

        vm.prank(bob);
        market.buy(100e6, false);

        // Alice sells half
        vm.prank(alice);
        market.sell(50e6, true);

        // Cost basis should be reduced
        // Initial: 100e6, sold 50e6 worth, reduced by 50e6
        assertEq(market.getCostBasis(alice, true), 50e6);
    }

    function test_CostBasis_SeparateForYesAndNo() public {
        // Alice buys both YES and NO
        vm.prank(alice);
        market.buy(100e6, true); // YES

        vm.prank(alice);
        market.buy(50e6, false); // NO

        // Check cost basis is tracked separately
        assertEq(market.getCostBasis(alice, true), 100e6);
        assertEq(market.getCostBasis(alice, false), 50e6);
    }

    function test_CostBasis_ZeroInitially() public {
        assertEq(market.getCostBasis(alice, true), 0);
        assertEq(market.getCostBasis(alice, false), 0);
    }

    // ========== Position Balance Tests ==========

    function test_GetPositionBalance_ReturnsCorrect() public {
        vm.prank(alice);
        market.buy(100e6, true);

        assertEq(market.getPositionBalance(alice, true), 100e6);
        assertEq(market.getPositionBalance(alice, false), 0);
    }

    function test_GetPositionBalance_MultipleUsers() public {
        vm.prank(alice);
        market.buy(100e6, true);

        vm.prank(bob);
        market.buy(200e6, false);

        assertEq(market.getPositionBalance(alice, true), 100e6);
        assertEq(market.getPositionBalance(bob, false), 200e6);
    }

    // ========== Pool Tests ==========

    function test_GetTotalPool() public {
        vm.prank(alice);
        market.buy(100e6, true);

        vm.prank(bob);
        market.buy(50e6, false);

        assertEq(market.getTotalPool(), 150e6);
    }

    // ========== Position ID Tests ==========

    function test_GetYesPositionId_Consistent() public view {
        uint256 yesId1 = market.getYesPositionId();
        uint256 yesId2 = market.getYesPositionId();
        assertEq(yesId1, yesId2);
    }

    function test_GetNoPositionId_Consistent() public view {
        uint256 noId1 = market.getNoPositionId();
        uint256 noId2 = market.getNoPositionId();
        assertEq(noId1, noId2);
    }

    function test_PositionIds_Different() public view {
        uint256 yesId = market.getYesPositionId();
        uint256 noId = market.getNoPositionId();
        assertTrue(yesId != noId, "YES and NO position IDs should differ");
    }

    // ========== Fuzz Tests ==========

    function testFuzz_BuySell_Symmetric(uint256 amount) public {
        // Bound amount to reasonable range (1 USDC to 1M USDC)
        amount = bound(amount, 1e6, 1_000_000e6);

        // Ensure users have enough funds
        usdc.mint(alice, amount);
        usdc.mint(bob, amount);

        // Alice buys YES, Bob buys NO
        vm.prank(alice);
        market.buy(amount, true);

        vm.prank(bob);
        market.buy(amount, false);

        // Verify pools
        assertEq(market.yesPool(), amount);
        assertEq(market.noPool(), amount);
        assertEq(market.getTotalPool(), amount * 2);

        // Verify positions
        assertEq(market.getPositionBalance(alice, true), amount);
        assertEq(market.getPositionBalance(bob, false), amount);

        // Verify cost basis
        assertEq(market.getCostBasis(alice, true), amount);
        assertEq(market.getCostBasis(bob, false), amount);
    }

    function testFuzz_Buy_AccumulatesCostBasis(uint256 amount1, uint256 amount2) public {
        amount1 = bound(amount1, 1e6, 1_000_000e6);
        amount2 = bound(amount2, 1e6, 1_000_000e6);

        usdc.mint(alice, amount1 + amount2);

        vm.startPrank(alice);
        market.buy(amount1, true);
        market.buy(amount2, true);
        vm.stopPrank();

        assertEq(market.getCostBasis(alice, true), amount1 + amount2);
        assertEq(market.getPositionBalance(alice, true), amount1 + amount2);
    }

    // ========== Edge Cases ==========

    function test_Buy_SmallAmount() public {
        vm.prank(alice);
        market.buy(1, true); // 1 wei of USDC

        assertEq(market.getPositionBalance(alice, true), 1);
        assertEq(market.getCostBasis(alice, true), 1);
    }

    function test_Sell_PartialWithOppositeTokens() public {
        // When Alice buys YES, the market splits USDC into YES+NO tokens
        // Alice gets the YES tokens, market KEEPS the NO tokens
        // So there ARE matching NO tokens when she sells
        vm.prank(alice);
        market.buy(100e6, true);

        uint256 aliceUsdcBefore = usdc.balanceOf(alice);

        // Alice sells half her YES tokens
        vm.prank(alice);
        market.sell(50e6, true);

        // Alice DOES get USDC back because the market has NO tokens
        // from the original splitPosition during her buy
        assertEq(usdc.balanceOf(alice), aliceUsdcBefore + 50e6);

        // Her YES tokens are reduced
        assertEq(market.getPositionBalance(alice, true), 50e6);
    }
}
