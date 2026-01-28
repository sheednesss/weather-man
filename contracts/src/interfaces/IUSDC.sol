// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IUSDC
/// @notice Interface for USDC token extending standard ERC20
/// @dev USDC uses 6 decimals. This interface is primarily for documentation.
///      In practice, we use IERC20 with SafeERC20 for all transfers.
interface IUSDC is IERC20 {
    /// @notice Returns the number of decimals (6 for USDC)
    /// @return The number of decimals
    function decimals() external view returns (uint8);

    /// @notice Returns the token name
    /// @return The token name
    function name() external view returns (string memory);

    /// @notice Returns the token symbol
    /// @return The token symbol
    function symbol() external view returns (string memory);
}
