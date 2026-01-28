# Phase 1: Smart Contract Foundation - Research

**Researched:** 2026-01-28
**Domain:** Solidity Smart Contracts / Prediction Markets / Base L2
**Confidence:** HIGH

## Summary

This research covers the smart contract foundation for a parimutuel prediction market on Base Sepolia, using Foundry for development and OpenZeppelin 5.x for security primitives. The architecture leverages the Gnosis Conditional Tokens Framework (CTF) for ERC-1155 outcome tokens, with USDC as the collateral token.

The standard approach for this phase involves: (1) deploying CTF-compatible contracts that prepare conditions, split/merge positions, and handle payouts; (2) using OpenZeppelin's SafeERC20 for all USDC interactions; (3) applying ReentrancyGuard + Checks-Effects-Interactions pattern on all state-changing functions; and (4) normalizing USDC's 6 decimals internally to prevent precision loss.

**Primary recommendation:** Use the Gnosis Conditional Tokens Framework as the foundation for outcome tokens, wrapping it with a MarketFactory that handles market creation and a parimutuel payout calculator that distributes the pool to winners proportionally.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Foundry | v1.0+ | Development toolchain | 2-5x faster than Hardhat, native Solidity testing, built-in fuzzing |
| Solidity | 0.8.24 | Smart contract language | Latest stable with overflow checks, custom errors |
| OpenZeppelin Contracts | 5.4.0 | Security primitives | Industry standard, audited, ERC-7201 namespaced storage |
| Gnosis CTF | 1.0.3 | Conditional token framework | Battle-tested ERC-1155 for prediction markets, used by Polymarket |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| forge-std | latest | Testing utilities | All tests - provides vm cheatcodes, console logging |
| OpenZeppelin SafeERC20 | 5.x | Safe token transfers | All USDC interactions |
| OpenZeppelin ReentrancyGuard | 5.x | Reentrancy protection | All external functions that transfer value |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Gnosis CTF | Custom ERC-1155 | CTF is proven but complex; custom is simpler but requires more testing |
| Foundry | Hardhat | Hardhat has larger ecosystem but Foundry is faster and tests in Solidity |
| Parimutuel | AMM (CLAMM) | AMM provides better liquidity but parimutuel is simpler for MVP |

**Installation:**
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize project
forge init prediction-market
cd prediction-market

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts@v5.4.0
forge install gnosis/conditional-tokens-contracts
forge install foundry-rs/forge-std
```

## Architecture Patterns

### Recommended Project Structure
```
contracts/
├── src/
│   ├── MarketFactory.sol        # Creates and manages markets
│   ├── PredictionMarket.sol     # Individual market logic
│   ├── PayoutCalculator.sol     # Parimutuel payout math
│   ├── interfaces/
│   │   ├── IConditionalTokens.sol
│   │   └── IMarketFactory.sol
│   └── libraries/
│       └── PositionLib.sol      # Position ID calculations
├── test/
│   ├── MarketFactory.t.sol
│   ├── PredictionMarket.t.sol
│   ├── invariants/
│   │   └── MarketInvariant.t.sol
│   └── handlers/
│       └── MarketHandler.sol
├── script/
│   └── Deploy.s.sol
├── foundry.toml
└── .env.example
```

### Pattern 1: Gnosis CTF Position Flow
**What:** The standard flow for creating and trading outcome positions
**When to use:** All market interactions

```solidity
// Source: https://conditional-tokens.readthedocs.io/en/latest/developer-guide.html

// Step 1: Prepare condition (done once per market)
conditionalTokens.prepareCondition(
    oracle,           // Address that will resolve the market
    questionId,       // bytes32 identifier for the question
    2                 // Binary outcome: YES (index 0) or NO (index 1)
);

// Step 2: User deposits collateral and gets outcome tokens
// Partition: [0b01, 0b10] means split into YES and NO
conditionalTokens.splitPosition(
    usdc,                    // Collateral token
    bytes32(0),              // Parent collection (0 for root)
    conditionId,             // From prepareCondition
    partition,               // [1, 2] for binary
    amount                   // USDC amount (6 decimals)
);

// Step 3: After resolution, redeem winning positions
conditionalTokens.redeemPositions(
    usdc,
    bytes32(0),
    conditionId,
    indexSets               // Which positions to redeem
);
```

### Pattern 2: Parimutuel Payout Calculation
**What:** Pool-based proportional payout distribution
**When to use:** Market resolution and claiming

```solidity
// Source: Verified parimutuel implementation pattern

// Parimutuel formula: payout = (userStake / winningPool) * totalPool
// With fee: payout = (userStake / winningPool) * (totalPool * (1 - feePercent))

function calculatePayout(
    uint256 userStake,
    uint256 winningPool,
    uint256 totalPool,
    uint256 feeBps  // Basis points (100 = 1%)
) internal pure returns (uint256) {
    if (winningPool == 0) return 0;

    uint256 netPool = totalPool * (10000 - feeBps) / 10000;
    // Multiply before divide to preserve precision
    return (userStake * netPool) / winningPool;
}
```

### Pattern 3: USDC Decimal Handling
**What:** Normalize 6-decimal USDC for internal calculations
**When to use:** All arithmetic involving USDC amounts

```solidity
// Source: https://calnix.gitbook.io/eth-dev/yield-mentorship-2022/projects/5-collateralized-vault/pricing-+-decimal-scaling

// USDC has 6 decimals, internal math uses 18
uint256 constant USDC_DECIMALS = 6;
uint256 constant INTERNAL_DECIMALS = 18;
uint256 constant DECIMAL_FACTOR = 10 ** (INTERNAL_DECIMALS - USDC_DECIMALS);

function toInternal(uint256 usdcAmount) internal pure returns (uint256) {
    return usdcAmount * DECIMAL_FACTOR;
}

function toUsdc(uint256 internalAmount) internal pure returns (uint256) {
    return internalAmount / DECIMAL_FACTOR;
}
```

### Anti-Patterns to Avoid
- **Direct external token calls:** Always use SafeERC20 for USDC interactions - USDC can change behavior
- **Assuming 18 decimals:** USDC uses 6 decimals; hardcoding 18 causes massive calculation errors
- **State changes after external calls:** Violates CEI pattern, enables reentrancy
- **Single oracle trust:** One oracle can manipulate outcomes; use multi-sig or time-delayed resolution
- **Division before multiplication:** Causes precision loss in payout calculations

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Outcome token standard | Custom ERC-20 per outcome | Gnosis CTF (ERC-1155) | CTF handles position IDs, splitting, merging, redemption |
| Reentrancy protection | Custom mutex | OpenZeppelin ReentrancyGuard | Battle-tested, gas-optimized, handles edge cases |
| Safe token transfers | Raw transfer/transferFrom | SafeERC20 | Handles non-standard returns, reverts properly |
| Access control | Custom modifiers | OpenZeppelin Ownable/AccessControl | Proven patterns, event emission, upgrade paths |
| Position ID calculation | Custom hashing | CTF's getPositionId/getCollectionId | Uses alt_bn128 for collision resistance |

**Key insight:** The Gnosis Conditional Tokens Framework solves the hardest problem - representing conditional outcomes as fungible tokens. Building custom outcome tokens would require reimplementing splitting, merging, and redemption logic that CTF already provides and that Polymarket has battle-tested with billions in volume.

## Common Pitfalls

### Pitfall 1: USDC Decimal Mismatch
**What goes wrong:** Calculations assume 18 decimals, causing 10^12x errors in payouts
**Why it happens:** Most ERC-20 examples use 18 decimals; USDC uses 6
**How to avoid:** Query `decimals()` on USDC, or use constants; normalize all internal math to 18 decimals
**Warning signs:** Tests passing with mock tokens but failing with real USDC; absurdly large or small payouts

### Pitfall 2: Oracle Manipulation
**What goes wrong:** Single oracle can resolve market incorrectly, draining funds
**Why it happens:** Trusting one EOA or contract to report truth
**How to avoid:** Use multi-sig oracle, time-delayed resolution with dispute period, or UMA optimistic oracle
**Warning signs:** No dispute mechanism; immediate finality on resolution

### Pitfall 3: Reentrancy on Payout
**What goes wrong:** Malicious contract re-enters during payout, draining pool
**Why it happens:** State updated after external call; missing reentrancy guard
**How to avoid:** Apply ReentrancyGuard + CEI pattern; mark positions as claimed BEFORE transfer
**Warning signs:** External calls before state updates; no nonReentrant modifier on payout functions

### Pitfall 4: Precision Loss in Pool Distribution
**What goes wrong:** Dust amounts lost or unfair distribution due to integer division
**Why it happens:** Dividing before multiplying; not accounting for remainders
**How to avoid:** Multiply before divide; track cumulative distributed vs. total; handle dust explicitly
**Warning signs:** Sum of payouts != pool total; last claimer gets different amount

### Pitfall 5: Missing SafeERC20 for USDC
**What goes wrong:** USDC transfer fails silently or reverts unexpectedly
**Why it happens:** USDC upgraded to return bool; not handling return value
**How to avoid:** Always use SafeERC20.safeTransfer and safeTransferFrom
**Warning signs:** Using raw IERC20.transfer; not checking return values

### Pitfall 6: Condition ID Collision
**What goes wrong:** Two markets share condition ID, corrupting both
**Why it happens:** Using same questionId + oracle combination
**How to avoid:** Include unique nonce or timestamp in questionId; verify condition not already prepared
**Warning signs:** prepareCondition not checking for existing condition; no event indexing

## Code Examples

Verified patterns from official sources:

### SafeERC20 USDC Deposit
```solidity
// Source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/utils/SafeERC20.sol

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Market {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    function deposit(uint256 amount) external {
        // SafeERC20 handles return value checking
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        // Update state AFTER transfer succeeds
        balances[msg.sender] += amount;
    }
}
```

### ReentrancyGuard with CEI Pattern
```solidity
// Source: https://docs.openzeppelin.com/contracts/5.x/api/utils

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Market is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function withdraw(uint256 amount) external nonReentrant {
        // CHECKS
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // EFFECTS (state change BEFORE external call)
        balances[msg.sender] -= amount;

        // INTERACTIONS (external call LAST)
        usdc.safeTransfer(msg.sender, amount);
    }
}
```

### CTF Position ID Calculation
```solidity
// Source: https://docs.polymarket.com/developers/CTF/overview

function getPositionIds(
    IConditionalTokens ct,
    IERC20 collateral,
    bytes32 conditionId
) internal view returns (uint256 yesPositionId, uint256 noPositionId) {
    // YES = indexSet 1 (0b01), NO = indexSet 2 (0b10)
    bytes32 yesCollectionId = ct.getCollectionId(bytes32(0), conditionId, 1);
    bytes32 noCollectionId = ct.getCollectionId(bytes32(0), conditionId, 2);

    yesPositionId = ct.getPositionId(collateral, yesCollectionId);
    noPositionId = ct.getPositionId(collateral, noCollectionId);
}
```

### Foundry Fuzz Test for Payout Calculation
```solidity
// Source: https://getfoundry.sh/forge/invariant-testing

import {Test} from "forge-std/Test.sol";

contract PayoutTest is Test {
    function testFuzz_PayoutNeverExceedsPool(
        uint256 userStake,
        uint256 winningPool,
        uint256 totalPool
    ) public {
        // Bound inputs to realistic values
        userStake = bound(userStake, 1, 1e12);      // Up to 1M USDC
        winningPool = bound(winningPool, userStake, 1e13);
        totalPool = bound(totalPool, winningPool, 1e14);

        uint256 payout = calculator.calculatePayout(
            userStake, winningPool, totalPool, 100 // 1% fee
        );

        // Invariant: payout never exceeds net pool
        assertLe(payout, totalPool * 9900 / 10000);
    }
}
```

### Foundry Deployment Script
```solidity
// Source: https://docs.base.org/tutorials/deploy-with-foundry/

// script/Deploy.s.sol
import {Script} from "forge-std/Script.sol";
import {MarketFactory} from "../src/MarketFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("USDC_ADDRESS");
        address ctf = vm.envAddress("CTF_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        MarketFactory factory = new MarketFactory(usdc, ctf);

        vm.stopBroadcast();
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardhat/Truffle | Foundry | 2023-2024 | 2-5x faster tests, native Solidity testing |
| OpenZeppelin 4.x | OpenZeppelin 5.x | Oct 2023 | Custom errors, ERC-7201 storage, explicit imports |
| require() strings | Custom errors | Solidity 0.8.4+ | ~50 gas savings per error |
| ReentrancyGuard in /security | ReentrancyGuard in /utils | OZ 5.0 | Updated import path |
| Manual fuzz testing | Foundry native fuzzing | 2023 | Built-in shrinking, invariant tests |
| 18-decimal assumptions | Dynamic decimal handling | Always | Critical for USDC/USDT integration |

**Deprecated/outdated:**
- OpenZeppelin 4.x import paths (e.g., `@openzeppelin/contracts/security/ReentrancyGuard.sol` is now `@openzeppelin/contracts/utils/ReentrancyGuard.sol`)
- String-based require messages (use custom errors)
- Hardhat for new projects (Foundry is now standard)
- Single-oracle resolution without dispute period

## Open Questions

Things that couldn't be fully resolved:

1. **CTF Contract Deployment on Base Sepolia**
   - What we know: CTF is deployed on mainnet, xDai, Rinkeby per GitHub
   - What's unclear: Whether CTF is deployed on Base Sepolia or needs fresh deployment
   - Recommendation: Check BaseScan for existing deployment; if not present, deploy CTF contracts first

2. **Oracle Design for MVP**
   - What we know: UMA, Chainlink, and multi-sig are options; UMA was manipulated on Polymarket
   - What's unclear: Best oracle pattern for a testnet MVP
   - Recommendation: Use owner-as-oracle for testnet (simple multi-sig); defer production oracle design

3. **Gas Optimization for Base**
   - What we know: Base is L2 with lower gas costs than mainnet
   - What's unclear: Specific gas optimizations worth pursuing on Base vs. mainnet
   - Recommendation: Profile after MVP; L2 gas is cheap enough that readability trumps micro-optimization

## Sources

### Primary (HIGH confidence)
- [Gnosis Conditional Tokens Developer Guide](https://conditional-tokens.readthedocs.io/en/latest/developer-guide.html) - Complete API reference
- [OpenZeppelin Contracts 5.x Docs](https://docs.openzeppelin.com/contracts/5.x) - Security primitives, import paths
- [Polymarket CTF Documentation](https://docs.polymarket.com/developers/CTF/overview) - Position ID calculation
- [Foundry Book](https://getfoundry.sh/) - Testing, deployment, configuration
- [Base Deployment Tutorial](https://docs.base.org/tutorials/deploy-with-foundry/) - Chain-specific configuration

### Secondary (MEDIUM confidence)
- [OpenZeppelin 5.0 Blog Post](https://blog.openzeppelin.com/introducing-openzeppelin-contracts-5.0) - Breaking changes, migration
- [Foundry v1.0 Announcement](https://www.paradigm.xyz/2025/02/announcing-foundry-v1-0) - Performance improvements
- [OWASP Smart Contract Top 10 2025](https://owasp.org/www-project-smart-contract-top-10/2025/en/src/SC02-price-oracle-manipulation.html) - Oracle manipulation risks

### Tertiary (LOW confidence)
- [DEV.to Prediction Market Tutorial](https://dev.to/sivarampg/building-a-production-ready-prediction-market-smart-contract-in-solidity-complete-guide-with-2iio) - Parimutuel implementation patterns
- [Medium Security Articles](https://medium.com/@palmartin99/advanced-smart-contract-security-in-2025-common-vulnerabilities-and-best-practices-in-solidity-and-eeb259e0e82e) - 2025 security trends

## Base Sepolia Configuration

### Network Details
| Setting | Value |
|---------|-------|
| Chain ID | 84532 |
| RPC URL | https://sepolia.base.org |
| Block Explorer | https://sepolia.basescan.org |
| USDC Address | 0x036cbd53842c5426634e7929541ec2318f3dcf7e |

### foundry.toml Configuration
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 200
via_ir = false

[rpc_endpoints]
base_sepolia = "${BASE_SEPOLIA_RPC}"
base_mainnet = "https://mainnet.base.org"
anvil = "http://127.0.0.1:8545"

[etherscan]
base_sepolia = { key = "${ETHERSCAN_API_KEY}", chain = 84532 }

[fuzz]
runs = 1000
max_test_rejects = 65536

[invariant]
runs = 256
depth = 128
fail_on_revert = true
```

### Environment Variables (.env)
```bash
BASE_SEPOLIA_RPC=https://sepolia.base.org
ETHERSCAN_API_KEY=<your-basescan-api-key>
PRIVATE_KEY=<deployer-private-key>
USDC_ADDRESS=0x036cbd53842c5426634e7929541ec2318f3dcf7e
```

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Foundry, OpenZeppelin 5.x, and CTF are well-documented
- Architecture: HIGH - CTF patterns verified from official docs and Polymarket implementation
- Pitfalls: HIGH - Based on OWASP 2025 data and documented exploits
- Base configuration: HIGH - From official Base documentation

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stable ecosystem)
