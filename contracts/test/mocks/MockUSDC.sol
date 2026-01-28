// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC
/// @notice Mock USDC token for testing with 6 decimals
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    /// @notice Returns 6 decimals like real USDC
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mints tokens to an address (for testing)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
