// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PositionLib
/// @notice Library for calculating CTF (Conditional Tokens Framework) position IDs
/// @dev These calculations match the CTF's internal position ID generation
library PositionLib {
    /// @notice Index set for YES outcome (binary 0b01)
    uint256 internal constant YES_INDEX = 1;

    /// @notice Index set for NO outcome (binary 0b10)
    uint256 internal constant NO_INDEX = 2;

    /// @notice Computes the condition ID for a question
    /// @param oracle The address that will resolve the condition
    /// @param questionId A unique identifier for the question
    /// @param outcomeSlotCount The number of possible outcomes
    /// @return The computed condition ID
    function getConditionId(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount));
    }

    /// @notice Computes the collection ID for an outcome
    /// @param parentCollectionId The parent collection (bytes32(0) for root)
    /// @param conditionId The condition ID
    /// @param indexSet The outcome index set (YES_INDEX or NO_INDEX)
    /// @return The computed collection ID
    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(parentCollectionId, conditionId, indexSet));
    }

    /// @notice Computes the ERC1155 position ID
    /// @param collateralToken The collateral token address
    /// @param collectionId The collection ID
    /// @return The position ID for ERC1155 balanceOf queries
    function getPositionId(
        address collateralToken,
        bytes32 collectionId
    ) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(collateralToken, collectionId)));
    }
}
