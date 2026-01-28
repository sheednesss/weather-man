// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Vault} from "../src/Vault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock USDC token for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract VaultTest is Test {
    Vault public vault;
    MockUSDC public usdc;
    address public user;
    address public user2;

    uint256 constant INITIAL_BALANCE = 1_000_000 * 1e6; // 1M USDC

    function setUp() public {
        // Deploy mock USDC
        usdc = new MockUSDC();

        // Deploy vault
        vault = new Vault(address(usdc));

        // Setup test users
        user = makeAddr("user");
        user2 = makeAddr("user2");

        // Mint USDC to users
        usdc.mint(user, INITIAL_BALANCE);
        usdc.mint(user2, INITIAL_BALANCE);

        // Approve vault for both users
        vm.prank(user);
        usdc.approve(address(vault), type(uint256).max);

        vm.prank(user2);
        usdc.approve(address(vault), type(uint256).max);
    }

    function test_Constructor_SetsUSDC() public view {
        assertEq(address(vault.usdc()), address(usdc));
    }

    function test_Constructor_RevertsOnZeroAddress() public {
        vm.expectRevert(Vault.ZeroAddress.selector);
        new Vault(address(0));
    }

    function test_Deposit_UpdatesBalance() public {
        uint256 depositAmount = 100 * 1e6; // 100 USDC

        vm.prank(user);
        vault.deposit(depositAmount);

        assertEq(vault.balances(user), depositAmount);
        assertEq(vault.balanceOf(user), depositAmount);
        assertEq(usdc.balanceOf(address(vault)), depositAmount);
        assertEq(usdc.balanceOf(user), INITIAL_BALANCE - depositAmount);
    }

    function test_Deposit_EmitsEvent() public {
        uint256 depositAmount = 100 * 1e6;

        vm.expectEmit(true, false, false, true);
        emit Vault.Deposit(user, depositAmount);

        vm.prank(user);
        vault.deposit(depositAmount);
    }

    function test_Deposit_RevertsIfZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(Vault.ZeroAmount.selector);
        vault.deposit(0);
    }

    function test_Withdraw_ReducesBalance() public {
        uint256 depositAmount = 100 * 1e6;
        uint256 withdrawAmount = 40 * 1e6;

        // First deposit
        vm.prank(user);
        vault.deposit(depositAmount);

        // Then withdraw
        vm.prank(user);
        vault.withdraw(withdrawAmount);

        assertEq(vault.balances(user), depositAmount - withdrawAmount);
        assertEq(usdc.balanceOf(user), INITIAL_BALANCE - depositAmount + withdrawAmount);
        assertEq(usdc.balanceOf(address(vault)), depositAmount - withdrawAmount);
    }

    function test_Withdraw_EmitsEvent() public {
        uint256 depositAmount = 100 * 1e6;
        uint256 withdrawAmount = 40 * 1e6;

        vm.prank(user);
        vault.deposit(depositAmount);

        vm.expectEmit(true, false, false, true);
        emit Vault.Withdraw(user, withdrawAmount);

        vm.prank(user);
        vault.withdraw(withdrawAmount);
    }

    function test_Withdraw_RevertsIfInsufficientBalance() public {
        uint256 depositAmount = 100 * 1e6;

        vm.prank(user);
        vault.deposit(depositAmount);

        vm.prank(user);
        vm.expectRevert(Vault.InsufficientBalance.selector);
        vault.withdraw(depositAmount + 1);
    }

    function test_Withdraw_RevertsIfZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(Vault.ZeroAmount.selector);
        vault.withdraw(0);
    }

    function test_Withdraw_RevertsIfNoBalance() public {
        vm.prank(user);
        vm.expectRevert(Vault.InsufficientBalance.selector);
        vault.withdraw(1);
    }

    function test_MultipleDeposits_AccumulateBalance() public {
        uint256 deposit1 = 100 * 1e6;
        uint256 deposit2 = 50 * 1e6;

        vm.startPrank(user);
        vault.deposit(deposit1);
        vault.deposit(deposit2);
        vm.stopPrank();

        assertEq(vault.balances(user), deposit1 + deposit2);
    }

    function test_MultipleUsers_IndependentBalances() public {
        uint256 user1Deposit = 100 * 1e6;
        uint256 user2Deposit = 200 * 1e6;

        vm.prank(user);
        vault.deposit(user1Deposit);

        vm.prank(user2);
        vault.deposit(user2Deposit);

        assertEq(vault.balances(user), user1Deposit);
        assertEq(vault.balances(user2), user2Deposit);
        assertEq(usdc.balanceOf(address(vault)), user1Deposit + user2Deposit);
    }

    function test_FullWithdraw_ZeroBalance() public {
        uint256 depositAmount = 100 * 1e6;

        vm.prank(user);
        vault.deposit(depositAmount);

        vm.prank(user);
        vault.withdraw(depositAmount);

        assertEq(vault.balances(user), 0);
        assertEq(usdc.balanceOf(user), INITIAL_BALANCE);
    }

    // Fuzz tests
    function testFuzz_DepositWithdraw(uint256 amount) public {
        // Bound amount to reasonable range (1 to 1e12 = 1 million USDC)
        amount = bound(amount, 1, 1e12);

        // Ensure user has enough USDC
        usdc.mint(user, amount);

        vm.startPrank(user);
        vault.deposit(amount);
        assertEq(vault.balances(user), amount);

        vault.withdraw(amount);
        assertEq(vault.balances(user), 0);
        vm.stopPrank();
    }

    function testFuzz_PartialWithdraw(uint256 depositAmount, uint256 withdrawAmount) public {
        depositAmount = bound(depositAmount, 1, 1e12);
        withdrawAmount = bound(withdrawAmount, 1, depositAmount);

        usdc.mint(user, depositAmount);

        vm.startPrank(user);
        vault.deposit(depositAmount);
        vault.withdraw(withdrawAmount);
        vm.stopPrank();

        assertEq(vault.balances(user), depositAmount - withdrawAmount);
    }

    function testFuzz_MultipleDepositsAndWithdraws(
        uint256 deposit1,
        uint256 deposit2,
        uint256 withdraw1
    ) public {
        deposit1 = bound(deposit1, 1, 1e12);
        deposit2 = bound(deposit2, 1, 1e12);
        uint256 totalDeposit = deposit1 + deposit2;
        withdraw1 = bound(withdraw1, 1, totalDeposit);

        usdc.mint(user, totalDeposit);

        vm.startPrank(user);
        vault.deposit(deposit1);
        vault.deposit(deposit2);
        vault.withdraw(withdraw1);
        vm.stopPrank();

        assertEq(vault.balances(user), totalDeposit - withdraw1);
    }
}
