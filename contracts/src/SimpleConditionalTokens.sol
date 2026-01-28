// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IConditionalTokens} from "./interfaces/IConditionalTokens.sol";

/// @title SimpleConditionalTokens
/// @notice Simplified CTF implementation for networks without Gnosis CTF
/// @dev Implements IConditionalTokens interface with ERC-1155 for outcome tokens
/// @dev Can be replaced with real Gnosis CTF on supported networks
contract SimpleConditionalTokens is IConditionalTokens, ERC1155 {
    using SafeERC20 for IERC20;

    /// @notice Mapping of prepared conditions
    mapping(bytes32 => bool) public conditionsPrepared;

    /// @notice Payout numerators for conditions
    mapping(bytes32 => mapping(uint256 => uint256)) private _payoutNumerators;

    /// @notice Payout denominators for conditions
    mapping(bytes32 => uint256) private _payoutDenominators;

    /// @notice Emitted when a condition is prepared
    event ConditionPrepared(
        bytes32 indexed conditionId,
        address indexed oracle,
        bytes32 indexed questionId,
        uint256 outcomeSlotCount
    );

    /// @notice Emitted when positions are split
    event PositionsSplit(
        address indexed stakeholder,
        IERC20 collateralToken,
        bytes32 indexed parentCollectionId,
        bytes32 indexed conditionId,
        uint256[] partition,
        uint256 amount
    );

    /// @notice Emitted when positions are merged
    event PositionsMerged(
        address indexed stakeholder,
        IERC20 collateralToken,
        bytes32 indexed parentCollectionId,
        bytes32 indexed conditionId,
        uint256[] partition,
        uint256 amount
    );

    /// @notice Emitted when payouts are reported
    event ConditionResolution(
        bytes32 indexed conditionId,
        address indexed oracle,
        bytes32 indexed questionId,
        uint256 outcomeSlotCount,
        uint256[] payoutNumerators
    );

    constructor() ERC1155("") {}

    /// @notice Prepares a condition for a question
    function prepareCondition(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external override {
        require(outcomeSlotCount >= 2, "Invalid outcome count");
        bytes32 conditionId = getConditionId(oracle, questionId, outcomeSlotCount);
        require(!conditionsPrepared[conditionId], "Condition already prepared");
        conditionsPrepared[conditionId] = true;
        emit ConditionPrepared(conditionId, oracle, questionId, outcomeSlotCount);
    }

    /// @notice Splits collateral into outcome tokens
    function splitPosition(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external override {
        require(conditionsPrepared[conditionId], "Condition not prepared");
        require(amount > 0, "Amount must be positive");

        // Pull collateral from caller
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        // Mint outcome tokens to caller for each partition index
        for (uint256 i = 0; i < partition.length; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            _mint(msg.sender, positionId, amount, "");
        }

        emit PositionsSplit(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
    }

    /// @notice Merges outcome tokens back into collateral
    function mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external override {
        require(amount > 0, "Amount must be positive");

        // Burn outcome tokens from caller for each partition index
        for (uint256 i = 0; i < partition.length; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            _burn(msg.sender, positionId, amount);
        }

        // Return collateral to caller
        collateralToken.safeTransfer(msg.sender, amount);

        emit PositionsMerged(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
    }

    /// @notice Redeems outcome tokens for collateral after resolution
    function redeemPositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata indexSets
    ) external override {
        uint256 denominator = _payoutDenominators[conditionId];
        require(denominator > 0, "Condition not resolved");

        uint256 totalPayout = 0;

        for (uint256 i = 0; i < indexSets.length; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, indexSets[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            uint256 balance = balanceOf(msg.sender, positionId);

            if (balance > 0) {
                _burn(msg.sender, positionId, balance);
                uint256 numerator = _payoutNumerators[conditionId][indexSets[i]];
                if (numerator > 0) {
                    totalPayout += (balance * numerator) / denominator;
                }
            }
        }

        if (totalPayout > 0) {
            collateralToken.safeTransfer(msg.sender, totalPayout);
        }
    }

    /// @notice Reports payouts for a condition (oracle only)
    function reportPayouts(
        bytes32 questionId,
        uint256[] calldata payouts
    ) external override {
        bytes32 conditionId = getConditionId(msg.sender, questionId, payouts.length);
        require(conditionsPrepared[conditionId], "Condition not prepared");
        require(_payoutDenominators[conditionId] == 0, "Already resolved");

        uint256 denominator = 0;
        for (uint256 i = 0; i < payouts.length; i++) {
            // Index sets are powers of 2: 1, 2, 4, 8, etc. for outcomes 0, 1, 2, 3
            uint256 indexSet = 1 << i;
            _payoutNumerators[conditionId][indexSet] = payouts[i];
            denominator += payouts[i];
        }
        require(denominator > 0, "Invalid payouts");
        _payoutDenominators[conditionId] = denominator;

        emit ConditionResolution(conditionId, msg.sender, questionId, payouts.length, payouts);
    }

    /// @notice Gets the condition ID
    function getConditionId(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) public pure override returns (bytes32) {
        return keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount));
    }

    /// @notice Gets the collection ID
    function getCollectionId(
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256 indexSet
    ) public pure override returns (bytes32) {
        return keccak256(abi.encodePacked(parentCollectionId, conditionId, indexSet));
    }

    /// @notice Gets the position ID
    function getPositionId(
        IERC20 collateralToken,
        bytes32 collectionId
    ) public pure override returns (uint256) {
        return uint256(keccak256(abi.encodePacked(address(collateralToken), collectionId)));
    }

    /// @notice Gets payout numerator
    function payoutNumerators(
        bytes32 conditionId,
        uint256 index
    ) external view override returns (uint256) {
        return _payoutNumerators[conditionId][index];
    }

    /// @notice Gets payout denominator
    function payoutDenominator(
        bytes32 conditionId
    ) external view override returns (uint256) {
        return _payoutDenominators[conditionId];
    }

    /// @notice Override balanceOf to satisfy both ERC1155 and IConditionalTokens
    /// @param account The account to check balance for
    /// @param id The token position ID
    /// @return The balance of the position
    function balanceOf(
        address account,
        uint256 id
    ) public view override(ERC1155, IConditionalTokens) returns (uint256) {
        return super.balanceOf(account, id);
    }
}
