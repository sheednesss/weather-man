// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IConditionalTokens} from "./interfaces/IConditionalTokens.sol";
import {PredictionMarket} from "./PredictionMarket.sol";
import {PositionLib} from "./libraries/PositionLib.sol";

/// @title MarketFactory
/// @notice Factory for creating and managing prediction markets
/// @dev Creates PredictionMarket instances and registers them with CTF
contract MarketFactory is Ownable {
    /// @notice The Conditional Tokens Framework contract
    IConditionalTokens public immutable conditionalTokens;

    /// @notice The USDC token used as collateral
    IERC20 public immutable usdc;

    /// @notice Mapping from condition ID to market address
    mapping(bytes32 => address) public markets;

    /// @notice Total number of markets created
    uint256 public marketCount;

    /// @notice Emitted when a new market is created
    event MarketCreated(
        bytes32 indexed conditionId,
        address indexed market,
        bytes32 questionId,
        uint256 resolutionTime
    );

    /// @notice Thrown when trying to create a market that already exists
    error MarketAlreadyExists();

    /// @notice Thrown when resolution time is invalid
    error InvalidResolutionTime();

    /// @notice Creates a new MarketFactory
    /// @param _conditionalTokens The CTF contract address
    /// @param _usdc The USDC token address
    constructor(
        address _conditionalTokens,
        address _usdc
    ) Ownable(msg.sender) {
        conditionalTokens = IConditionalTokens(_conditionalTokens);
        usdc = IERC20(_usdc);
    }

    /// @notice Creates a new prediction market
    /// @param questionId Unique identifier for the question
    /// @param resolutionTime Unix timestamp when the market can be resolved
    /// @return The address of the newly created market
    function createMarket(
        bytes32 questionId,
        uint256 resolutionTime
    ) external returns (address) {
        // Validate resolution time is in the future
        if (resolutionTime <= block.timestamp) revert InvalidResolutionTime();

        // Calculate condition ID (oracle = this factory for MVP)
        bytes32 conditionId = PositionLib.getConditionId(
            address(this),
            questionId,
            2 // Binary outcome
        );

        // Check market doesn't already exist
        if (markets[conditionId] != address(0)) revert MarketAlreadyExists();

        // Prepare the condition on CTF
        conditionalTokens.prepareCondition(
            address(this), // oracle
            questionId,
            2 // outcomeSlotCount (binary: YES/NO)
        );

        // Deploy new PredictionMarket
        PredictionMarket market = new PredictionMarket(
            conditionId,
            address(conditionalTokens),
            address(usdc),
            address(this)
        );

        // Register market
        markets[conditionId] = address(market);
        marketCount++;

        emit MarketCreated(conditionId, address(market), questionId, resolutionTime);

        return address(market);
    }

    /// @notice Gets the market address for a condition ID
    /// @param conditionId The condition ID to look up
    /// @return The market address, or zero if not found
    function getMarket(bytes32 conditionId) external view returns (address) {
        return markets[conditionId];
    }
}
