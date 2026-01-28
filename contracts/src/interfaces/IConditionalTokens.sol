// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IConditionalTokens
/// @notice Interface for the Gnosis Conditional Tokens Framework (CTF)
/// @dev Used for creating prediction markets with outcome tokens
interface IConditionalTokens {
    /// @notice Prepares a condition for a question with multiple outcomes
    /// @param oracle The address that will resolve the condition
    /// @param questionId A unique identifier for the question
    /// @param outcomeSlotCount The number of possible outcomes
    function prepareCondition(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external;

    /// @notice Splits collateral into outcome tokens
    /// @param collateralToken The ERC20 token to use as collateral
    /// @param parentCollectionId The parent collection (0x0 for root)
    /// @param conditionId The condition to split on
    /// @param partition Array of index sets representing outcome positions
    /// @param amount Amount of collateral to split
    function splitPosition(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external;

    /// @notice Merges outcome tokens back into collateral
    /// @param collateralToken The ERC20 token used as collateral
    /// @param parentCollectionId The parent collection (0x0 for root)
    /// @param conditionId The condition to merge on
    /// @param partition Array of index sets representing outcome positions
    /// @param amount Amount of tokens to merge
    function mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external;

    /// @notice Redeems outcome tokens for collateral after condition resolution
    /// @param collateralToken The ERC20 token used as collateral
    /// @param parentCollectionId The parent collection (0x0 for root)
    /// @param conditionId The resolved condition
    /// @param indexSets Array of index sets to redeem
    function redeemPositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata indexSets
    ) external;

    /// @notice Reports the final payouts for a condition
    /// @param questionId The question being resolved
    /// @param payouts Array of payout numerators for each outcome
    function reportPayouts(
        bytes32 questionId,
        uint256[] calldata payouts
    ) external;

    /// @notice Computes the condition ID from oracle, question, and outcomes
    /// @param oracle The oracle address
    /// @param questionId The question identifier
    /// @param outcomeSlotCount The number of outcomes
    /// @return The computed condition ID
    function getConditionId(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external pure returns (bytes32);

    /// @notice Computes the collection ID for a condition outcome
    /// @param parentCollectionId The parent collection
    /// @param conditionId The condition
    /// @param indexSet The outcome index set
    /// @return The computed collection ID
    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) external view returns (bytes32);

    /// @notice Computes the ERC1155 position ID
    /// @param collateralToken The collateral token
    /// @param collectionId The collection
    /// @return The position ID
    function getPositionId(
        IERC20 collateralToken,
        bytes32 collectionId
    ) external pure returns (uint256);

    /// @notice Gets the balance of outcome tokens for an account
    /// @param account The account to query
    /// @param id The position ID
    /// @return The balance
    function balanceOf(
        address account,
        uint256 id
    ) external view returns (uint256);

    /// @notice Gets the payout numerator for a condition outcome
    /// @param conditionId The condition
    /// @param index The outcome index
    /// @return The payout numerator
    function payoutNumerators(
        bytes32 conditionId,
        uint256 index
    ) external view returns (uint256);

    /// @notice Gets the payout denominator for a condition
    /// @param conditionId The condition
    /// @return The payout denominator
    function payoutDenominator(
        bytes32 conditionId
    ) external view returns (uint256);
}
