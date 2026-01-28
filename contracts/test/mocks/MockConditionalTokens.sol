// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IConditionalTokens} from "../../src/interfaces/IConditionalTokens.sol";

/// @title MockConditionalTokens
/// @notice Mock implementation of CTF for testing
/// @dev Simulates CTF behavior for unit tests
contract MockConditionalTokens is IConditionalTokens {
    using SafeERC20 for IERC20;

    /// @notice Mapping of prepared conditions
    mapping(bytes32 => bool) public conditionsPrepared;

    /// @notice Mapping of balances: positionId => account => balance
    mapping(uint256 => mapping(address => uint256)) private _balances;

    /// @notice Mapping of approvals: account => operator => approved
    mapping(address => mapping(address => bool)) private _approvals;

    /// @notice Payout numerators for conditions
    mapping(bytes32 => mapping(uint256 => uint256)) private _payoutNumerators;

    /// @notice Payout denominators for conditions
    mapping(bytes32 => uint256) private _payoutDenominators;

    /// @notice Prepares a condition for a question
    function prepareCondition(
        address oracle,
        bytes32 questionId,
        uint256 outcomeSlotCount
    ) external override {
        bytes32 conditionId = getConditionId(oracle, questionId, outcomeSlotCount);
        conditionsPrepared[conditionId] = true;
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

        // Pull collateral from caller
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        // Mint outcome tokens to caller for each partition index
        for (uint256 i = 0; i < partition.length; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            _balances[positionId][msg.sender] += amount;
        }
    }

    /// @notice Merges outcome tokens back into collateral
    function mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external override {
        // Burn outcome tokens from caller for each partition index
        for (uint256 i = 0; i < partition.length; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, partition[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            require(_balances[positionId][msg.sender] >= amount, "Insufficient balance");
            _balances[positionId][msg.sender] -= amount;
        }

        // Return collateral to caller
        collateralToken.safeTransfer(msg.sender, amount);
    }

    /// @notice Redeems outcome tokens for collateral (simplified for mock)
    function redeemPositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata indexSets
    ) external override {
        // Simplified: burn tokens and return collateral proportionally
        for (uint256 i = 0; i < indexSets.length; i++) {
            bytes32 collectionId = getCollectionId(parentCollectionId, conditionId, indexSets[i]);
            uint256 positionId = getPositionId(collateralToken, collectionId);
            uint256 balance = _balances[positionId][msg.sender];
            if (balance > 0) {
                _balances[positionId][msg.sender] = 0;
                uint256 numerator = _payoutNumerators[conditionId][indexSets[i]];
                uint256 denominator = _payoutDenominators[conditionId];
                if (denominator > 0 && numerator > 0) {
                    uint256 payout = (balance * numerator) / denominator;
                    collateralToken.safeTransfer(msg.sender, payout);
                }
            }
        }
    }

    /// @notice Reports payouts for a condition
    function reportPayouts(
        bytes32 questionId,
        uint256[] calldata payouts
    ) external override {
        // Calculate condition ID (assumes msg.sender is oracle)
        bytes32 conditionId = getConditionId(msg.sender, questionId, payouts.length);
        uint256 denominator = 0;
        for (uint256 i = 0; i < payouts.length; i++) {
            _payoutNumerators[conditionId][i + 1] = payouts[i]; // index sets are 1-indexed
            denominator += payouts[i];
        }
        _payoutDenominators[conditionId] = denominator;
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

    /// @notice Gets balance of outcome tokens
    function balanceOf(
        address account,
        uint256 id
    ) external view override returns (uint256) {
        return _balances[id][account];
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

    // ========== ERC-1155 Support ==========

    /// @notice Sets approval for an operator
    function setApprovalForAll(address operator, bool approved) external {
        _approvals[msg.sender][operator] = approved;
    }

    /// @notice Checks if operator is approved
    function isApprovedForAll(address account, address operator) external view returns (bool) {
        return _approvals[account][operator];
    }

    /// @notice Transfers tokens (ERC-1155 style)
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata /* data */
    ) external {
        require(
            from == msg.sender || _approvals[from][msg.sender],
            "Not approved"
        );
        require(_balances[id][from] >= amount, "Insufficient balance");
        _balances[id][from] -= amount;
        _balances[id][to] += amount;
    }

    /// @notice Batch transfer (ERC-1155 style)
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata /* data */
    ) external {
        require(
            from == msg.sender || _approvals[from][msg.sender],
            "Not approved"
        );
        for (uint256 i = 0; i < ids.length; i++) {
            require(_balances[ids[i]][from] >= amounts[i], "Insufficient balance");
            _balances[ids[i]][from] -= amounts[i];
            _balances[ids[i]][to] += amounts[i];
        }
    }
}
