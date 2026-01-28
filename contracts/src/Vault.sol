// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Vault
/// @notice USDC custody contract with deposit and withdraw functionality
/// @dev Uses SafeERC20 for safe token transfers and ReentrancyGuard for protection
contract Vault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The USDC token contract
    IERC20 public immutable usdc;

    /// @notice Mapping of user addresses to their deposited balances
    mapping(address => uint256) public balances;

    /// @notice Emitted when a user deposits USDC
    /// @param user The address that deposited
    /// @param amount The amount deposited (in USDC native units, 6 decimals)
    event Deposit(address indexed user, uint256 amount);

    /// @notice Emitted when a user withdraws USDC
    /// @param user The address that withdrew
    /// @param amount The amount withdrawn (in USDC native units, 6 decimals)
    event Withdraw(address indexed user, uint256 amount);

    /// @notice Thrown when an operation requires a non-zero amount
    error ZeroAmount();

    /// @notice Thrown when a zero address is provided
    error ZeroAddress();

    /// @notice Thrown when withdrawal amount exceeds balance
    error InsufficientBalance();

    /// @notice Creates a new Vault instance
    /// @param _usdc The address of the USDC token contract
    constructor(address _usdc) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
    }

    /// @notice Deposits USDC into the vault
    /// @param amount The amount to deposit (in USDC native units, 6 decimals)
    /// @dev Requires prior approval of USDC to this contract
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();

        // Transfer USDC from sender to this contract
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Update balance after successful transfer
        balances[msg.sender] += amount;

        emit Deposit(msg.sender, amount);
    }

    /// @notice Withdraws USDC from the vault
    /// @param amount The amount to withdraw (in USDC native units, 6 decimals)
    /// @dev Follows Checks-Effects-Interactions (CEI) pattern
    function withdraw(uint256 amount) external nonReentrant {
        // CHECKS
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();

        // EFFECTS
        balances[msg.sender] -= amount;

        // INTERACTIONS
        usdc.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    /// @notice Returns the deposited balance for an account
    /// @param account The account to query
    /// @return The balance in USDC native units (6 decimals)
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
