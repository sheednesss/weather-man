// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IConditionalTokens} from "./interfaces/IConditionalTokens.sol";
import {PositionLib} from "./libraries/PositionLib.sol";

/// @title PredictionMarket
/// @notice A prediction market for binary outcomes using Gnosis CTF
/// @dev Enables buying/selling YES and NO outcome shares with cost basis tracking
contract PredictionMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The Conditional Tokens Framework contract
    IConditionalTokens public immutable conditionalTokens;

    /// @notice The USDC token used as collateral
    IERC20 public immutable usdc;

    /// @notice The condition ID for this market's question
    bytes32 public immutable conditionId;

    /// @notice The question ID used to prepare the condition
    bytes32 public immutable questionId;

    /// @notice The factory that created this market
    address public immutable factory;

    /// @notice Total USDC in YES outcome pool
    uint256 public yesPool;

    /// @notice Total USDC in NO outcome pool
    uint256 public noPool;

    /// @notice Whether the market has been resolved
    bool public resolved;

    /// @notice Tracks cumulative USDC spent per user per outcome for P&L calculation
    /// @dev costBasis[user][isYes] = total USDC spent on that outcome
    mapping(address => mapping(bool => uint256)) public costBasis;

    /// @notice Emitted when a user buys outcome shares
    event Buy(address indexed user, uint256 amount, bool indexed isYes);

    /// @notice Emitted when a user sells outcome shares
    event Sell(address indexed user, uint256 amount, bool indexed isYes);

    /// @notice Emitted when market is resolved
    event MarketResolved(bytes32 indexed conditionId);

    /// @notice Thrown when market has been resolved
    error AlreadyResolved();

    /// @notice Thrown when caller is not the factory
    error OnlyFactory();

    /// @notice Thrown when user has insufficient shares
    error InsufficientShares();

    /// @notice Thrown when amount is zero
    error ZeroAmount();

    /// @notice Creates a new prediction market
    /// @param _conditionId The CTF condition ID for this market
    /// @param _questionId The question ID used to prepare the condition
    /// @param _conditionalTokens The CTF contract address
    /// @param _usdc The USDC token address
    /// @param _factory The factory that created this market
    constructor(
        bytes32 _conditionId,
        bytes32 _questionId,
        address _conditionalTokens,
        address _usdc,
        address _factory
    ) {
        conditionId = _conditionId;
        questionId = _questionId;
        conditionalTokens = IConditionalTokens(_conditionalTokens);
        usdc = IERC20(_usdc);
        factory = _factory;
    }

    /// @notice Buys outcome shares by depositing USDC
    /// @param amount The amount of USDC to spend
    /// @param isYes True for YES shares, false for NO shares
    /// @dev Splits USDC into both outcome tokens, gives user requested outcome
    function buy(uint256 amount, bool isYes) external nonReentrant {
        // CHECKS
        if (amount == 0) revert ZeroAmount();
        if (resolved) revert AlreadyResolved();

        // INTERACTIONS: Pull USDC from user
        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Approve CTF to spend USDC for splitPosition
        usdc.approve(address(conditionalTokens), amount);

        // Create partition for binary outcome: [YES, NO] = [1, 2]
        uint256[] memory partition = new uint256[](2);
        partition[0] = PositionLib.YES_INDEX;
        partition[1] = PositionLib.NO_INDEX;

        // Split USDC into both YES and NO tokens
        conditionalTokens.splitPosition(
            usdc,
            bytes32(0), // parentCollectionId (root)
            conditionId,
            partition,
            amount
        );

        // Transfer requested outcome tokens to user
        // The opposite tokens remain in contract as pool reserve
        uint256 positionId = isYes ? getYesPositionId() : getNoPositionId();

        // Transfer outcome tokens to user (CTF is ERC-1155)
        // Note: This requires the market to hold the tokens after split
        // The CTF's splitPosition gives tokens to msg.sender (this contract)
        // We need to transfer them to the actual user via ERC-1155 safeTransferFrom
        // For MVP, user receives tokens directly from CTF behavior
        // CTF behavior: splitPosition mints tokens to caller (this contract)
        // We transfer to user using CTF's ERC-1155 interface
        _transferOutcomeTokens(msg.sender, positionId, amount);

        // EFFECTS: Update pool and cost basis
        if (isYes) {
            yesPool += amount;
        } else {
            noPool += amount;
        }
        costBasis[msg.sender][isYes] += amount;

        emit Buy(msg.sender, amount, isYes);
    }

    /// @notice Sells outcome shares back for USDC
    /// @param amount The amount of shares to sell
    /// @param isYes True for YES shares, false for NO shares
    /// @dev Merges outcome tokens back into USDC when contract has matching opposite tokens
    function sell(uint256 amount, bool isYes) external nonReentrant {
        // CHECKS
        if (amount == 0) revert ZeroAmount();
        if (resolved) revert AlreadyResolved();

        uint256 userPositionId = isYes ? getYesPositionId() : getNoPositionId();
        uint256 userBalance = conditionalTokens.balanceOf(msg.sender, userPositionId);
        if (userBalance < amount) revert InsufficientShares();

        // INTERACTIONS: Pull outcome tokens from user
        // User must have approved this contract on CTF via setApprovalForAll
        _pullOutcomeTokens(msg.sender, userPositionId, amount);

        // Check if we have matching opposite tokens to merge
        uint256 oppositePositionId = isYes ? getNoPositionId() : getYesPositionId();
        uint256 oppositeBalance = conditionalTokens.balanceOf(address(this), oppositePositionId);

        // Calculate how much we can actually merge (limited by opposite tokens)
        uint256 mergeAmount = amount < oppositeBalance ? amount : oppositeBalance;

        if (mergeAmount > 0) {
            // Create partition for merge
            uint256[] memory partition = new uint256[](2);
            partition[0] = PositionLib.YES_INDEX;
            partition[1] = PositionLib.NO_INDEX;

            // Merge tokens back into USDC
            conditionalTokens.mergePositions(
                usdc,
                bytes32(0),
                conditionId,
                partition,
                mergeAmount
            );

            // Transfer USDC to user
            usdc.safeTransfer(msg.sender, mergeAmount);
        }

        // EFFECTS: Update pool
        if (isYes) {
            if (yesPool >= mergeAmount) {
                yesPool -= mergeAmount;
            } else {
                yesPool = 0;
            }
        } else {
            if (noPool >= mergeAmount) {
                noPool -= mergeAmount;
            } else {
                noPool = 0;
            }
        }

        // Reduce cost basis proportionally: if selling all, zero out; otherwise proportional reduction
        uint256 currentCostBasis = costBasis[msg.sender][isYes];
        if (currentCostBasis > 0) {
            // For MVP: reduce by USDC received (capped at current cost basis)
            uint256 reduction = mergeAmount > currentCostBasis ? currentCostBasis : mergeAmount;
            costBasis[msg.sender][isYes] = currentCostBasis - reduction;
        }

        emit Sell(msg.sender, amount, isYes);
    }

    /// @notice Gets the cost basis for a user's position
    /// @param user The user address
    /// @param isYes True for YES position, false for NO position
    /// @return The total USDC spent on this outcome
    function getCostBasis(address user, bool isYes) external view returns (uint256) {
        return costBasis[user][isYes];
    }

    /// @notice Gets the balance of outcome tokens for a user
    /// @param user The user address
    /// @param isYes True for YES position, false for NO position
    /// @return The token balance
    function getPositionBalance(address user, bool isYes) external view returns (uint256) {
        uint256 positionId = isYes ? getYesPositionId() : getNoPositionId();
        return conditionalTokens.balanceOf(user, positionId);
    }

    /// @notice Gets the ERC1155 position ID for YES outcome
    /// @return The YES position ID
    function getYesPositionId() public view returns (uint256) {
        bytes32 collectionId = PositionLib.getCollectionId(
            bytes32(0),
            conditionId,
            PositionLib.YES_INDEX
        );
        return PositionLib.getPositionId(address(usdc), collectionId);
    }

    /// @notice Gets the ERC1155 position ID for NO outcome
    /// @return The NO position ID
    function getNoPositionId() public view returns (uint256) {
        bytes32 collectionId = PositionLib.getCollectionId(
            bytes32(0),
            conditionId,
            PositionLib.NO_INDEX
        );
        return PositionLib.getPositionId(address(usdc), collectionId);
    }

    /// @notice Gets the total USDC in both pools
    /// @return The combined pool value
    function getTotalPool() external view returns (uint256) {
        return yesPool + noPool;
    }

    /// @notice Marks the market as resolved (factory only)
    /// @dev Called by factory after reporting payouts to CTF
    function setResolved() external {
        if (msg.sender != factory) revert OnlyFactory();
        resolved = true;
        emit MarketResolved(conditionId);
    }

    /// @notice Internal helper to transfer outcome tokens to user
    /// @dev Uses CTF's ERC-1155 safeTransferFrom
    function _transferOutcomeTokens(address to, uint256 positionId, uint256 amount) internal {
        // CTF implements IERC1155, so we use its safeTransferFrom
        // The market contract holds the tokens after splitPosition
        bytes memory data = "";
        // Call CTF's safeTransferFrom(from, to, id, amount, data)
        (bool success,) = address(conditionalTokens).call(
            abi.encodeWithSignature(
                "safeTransferFrom(address,address,uint256,uint256,bytes)",
                address(this),
                to,
                positionId,
                amount,
                data
            )
        );
        require(success, "Token transfer failed");
    }

    /// @notice Internal helper to pull outcome tokens from user
    /// @dev User must have approved this contract on CTF
    function _pullOutcomeTokens(address from, uint256 positionId, uint256 amount) internal {
        bytes memory data = "";
        (bool success,) = address(conditionalTokens).call(
            abi.encodeWithSignature(
                "safeTransferFrom(address,address,uint256,uint256,bytes)",
                from,
                address(this),
                positionId,
                amount,
                data
            )
        );
        require(success, "Token pull failed");
    }
}
