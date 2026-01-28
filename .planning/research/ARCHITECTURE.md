# Architecture Patterns: Weather Man Prediction Market

**Domain:** Social prediction market dApp with weather oracle integration on Base L2
**Researched:** 2026-01-28
**Confidence:** MEDIUM-HIGH (verified against Polymarket architecture, Base docs, UMA docs)

---

## Executive Summary

Weather Man requires a **hybrid-decentralized architecture** following the proven Polymarket pattern: off-chain order matching with on-chain settlement, combined with a custom weather oracle aggregation layer. The architecture separates into five distinct layers: Smart Contracts, Oracle Services, Backend Services, Indexing, and Frontend.

**Key architectural decision:** Use Gnosis Conditional Tokens Framework (CTF) for outcome tokenization rather than custom ERC20s per market. This is the industry standard (used by Polymarket) and enables composability.

---

## Recommended Architecture

```
+------------------+     +-------------------+     +------------------+
|    FRONTEND      |     |  BACKEND SERVICES |     |   ORACLE LAYER   |
|  (React/Next.js) |<--->|   (Node.js API)   |<--->| Weather Aggregator|
|  wagmi + viem    |     |   Order Matching  |     | (AccuWeather,    |
|  RainbowKit      |     |   Social Features |     |  OpenWeather,    |
+--------+---------+     +--------+----------+     |  WeatherXM)      |
         |                        |                +--------+---------+
         |                        |                         |
         v                        v                         v
+--------+------------------------+-------------------------+---------+
|                        BASE L2 BLOCKCHAIN                           |
|  +----------------+  +----------------+  +----------------------+   |
|  | CTF Exchange   |  | Weather Oracle |  | Market Factory       |   |
|  | (Settlement)   |  | Adapter        |  | (Market Creation)    |   |
|  +----------------+  +----------------+  +----------------------+   |
|  +----------------+  +----------------+  +----------------------+   |
|  | Conditional    |  | UMA OOV3       |  | Chainlink Automation |   |
|  | Tokens (CTF)   |  | (Disputes)     |  | (Auto-Resolution)    |   |
|  +----------------+  +----------------+  +----------------------+   |
+--------------------------+--------------------------------------+---+
                           |
                           v
              +------------+-------------+
              |     INDEXING LAYER       |
              |  (The Graph / Goldsky)   |
              |  GraphQL API for events  |
              +--------------------------+
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | On/Off Chain |
|-----------|---------------|-------------------|--------------|
| **Market Factory** | Creates new prediction markets, deploys conditions | CTF, Oracle Adapter | On-chain |
| **CTF Exchange** | Atomic swaps, split/merge positions, settlement | Conditional Tokens, USDC | On-chain |
| **Conditional Tokens** | ERC1155 outcome tokens, position management | CTF Exchange, users | On-chain |
| **Weather Oracle Adapter** | Aggregates weather data, triggers resolution | Weather APIs, UMA OOV3 | On-chain |
| **UMA OOV3** | Dispute resolution fallback | Oracle Adapter | On-chain |
| **Chainlink Automation** | Time-based market resolution triggers | Oracle Adapter, Markets | On-chain |
| **Order Matching Service** | Off-chain order book, maker/taker matching | CTF Exchange, Frontend | Off-chain |
| **Weather Aggregator** | Fetches from 3 APIs, median calculation | Oracle Adapter | Off-chain |
| **Social Service** | Follows, comments, notifications | Database, Frontend | Off-chain |
| **Indexer (Subgraph)** | Event indexing, GraphQL queries | All contracts, Frontend | Off-chain |
| **Frontend** | User interface, wallet connection | All services | Off-chain |

---

## Data Flow

### 1. Market Creation Flow

```
User Request -> Backend validates -> Market Factory contract
                                            |
                                            v
                              Conditional Tokens (prepareCondition)
                                            |
                                            v
                              Oracle Adapter (register resolution params)
                                            |
                                            v
                              Chainlink Automation (schedule trigger)
                                            |
                                            v
                              Subgraph indexes MarketCreated event
```

### 2. Trading Flow (Hybrid Order Book)

```
User creates order -> Signs EIP-712 typed data (off-chain)
                              |
                              v
              Order Matching Service receives order
                              |
                              v
              Matches with counterparty (off-chain)
                              |
                              v
              Submits matched orders to CTF Exchange (on-chain)
                              |
                              v
              CTF Exchange executes atomic swap:
              - If complementary: mint YES + NO tokens
              - If same side: transfer existing tokens
              - USDC locked/transferred as collateral
                              |
                              v
              Subgraph indexes Trade event
```

### 3. Market Resolution Flow

```
Resolution time reached -> Chainlink Automation triggers checkUpkeep
                                       |
                                       v
                          Weather Aggregator fetches from 3 APIs:
                          - AccuWeather (Chainlink node)
                          - OpenWeather
                          - Third source (WeatherXM or backup)
                                       |
                                       v
                          Calculates median, validates consensus
                                       |
                                       v
                          Oracle Adapter receives aggregated data
                                       |
                                       v
                          Assert outcome via UMA OOV3 pattern
                          (2-hour liveness period for disputes)
                                       |
              +------------------------+------------------------+
              |                                                 |
        No Dispute                                         Dispute
              |                                                 |
              v                                                 v
    Oracle Adapter resolves                           UMA DVM arbitration
    Conditional Tokens payout                         (token holder vote)
              |                                                 |
              v                                                 v
    Users redeem winning tokens                       Final resolution
    for USDC collateral                               applied to market
```

### 4. Social Features Flow

```
User action (follow/comment) -> Backend API -> PostgreSQL
                                      |
                                      v
                          (Optional) On-chain attestation
                          for high-value social actions
                                      |
                                      v
                          Push notification to followers
```

---

## Smart Contract Architecture

### Contract Hierarchy

```
contracts/
  core/
    MarketFactory.sol          # Creates markets, manages parameters
    WeatherOracleAdapter.sol   # Bridges weather data to resolution
    CTFExchange.sol            # Trading and settlement (fork Polymarket)
  tokens/
    ConditionalTokens.sol      # Gnosis CTF (use as dependency)
  automation/
    MarketResolver.sol         # Chainlink Automation compatible
  interfaces/
    IWeatherOracle.sol
    IMarketFactory.sol
```

### Key Contract: MarketFactory.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IConditionalTokens} from "./interfaces/IConditionalTokens.sol";

contract MarketFactory {
    IConditionalTokens public immutable conditionalTokens;
    address public immutable oracle;
    IERC20 public immutable usdc;

    struct Market {
        bytes32 conditionId;
        bytes32 questionId;
        string location;
        uint256 targetTimestamp;
        WeatherMetric metric;
        int256 threshold;
        bool resolved;
    }

    enum WeatherMetric { TEMPERATURE, PRECIPITATION, WIND_SPEED }

    mapping(bytes32 => Market) public markets;

    event MarketCreated(
        bytes32 indexed marketId,
        bytes32 indexed conditionId,
        string location,
        uint256 targetTimestamp,
        WeatherMetric metric,
        int256 threshold
    );

    function createMarket(
        string calldata location,
        uint256 targetTimestamp,
        WeatherMetric metric,
        int256 threshold
    ) external returns (bytes32 marketId) {
        // Generate unique question ID
        bytes32 questionId = keccak256(abi.encode(
            location, targetTimestamp, metric, threshold, block.timestamp
        ));

        // Prepare condition in CTF (binary: YES/NO = 2 outcomes)
        conditionalTokens.prepareCondition(oracle, questionId, 2);

        bytes32 conditionId = conditionalTokens.getConditionId(
            oracle, questionId, 2
        );

        marketId = keccak256(abi.encode(conditionId));

        markets[marketId] = Market({
            conditionId: conditionId,
            questionId: questionId,
            location: location,
            targetTimestamp: targetTimestamp,
            metric: metric,
            threshold: threshold,
            resolved: false
        });

        emit MarketCreated(
            marketId, conditionId, location,
            targetTimestamp, metric, threshold
        );
    }
}
```

### Key Contract: WeatherOracleAdapter.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OptimisticOracleV3Interface} from "@uma/core/contracts/...";
import {IConditionalTokens} from "./interfaces/IConditionalTokens.sol";

contract WeatherOracleAdapter {
    OptimisticOracleV3Interface public immutable oo;
    IConditionalTokens public immutable conditionalTokens;

    uint64 public constant LIVENESS = 7200; // 2 hours for disputes

    struct Resolution {
        bytes32 marketId;
        bytes32 assertionId;
        int256 observedValue;
        bool outcomeYes;
    }

    mapping(bytes32 => Resolution) public resolutions;

    // Called by off-chain Weather Aggregator via relayer
    function proposeResolution(
        bytes32 marketId,
        int256 observedValue,
        bool outcomeYes
    ) external {
        // Build claim for UMA
        bytes memory claim = abi.encode(
            "Weather observation for market: ",
            marketId,
            " Value: ",
            observedValue,
            " Outcome YES: ",
            outcomeYes
        );

        // Assert with UMA OOV3
        bytes32 assertionId = oo.assertTruth(
            claim,
            msg.sender,      // asserter
            address(this),   // callback recipient
            address(0),      // escalation manager (none)
            LIVENESS,
            IERC20(usdc),    // bond currency
            1e6,             // 1 USDC bond
            bytes32(0),      // identifier
            bytes32(0)       // domain
        );

        resolutions[marketId] = Resolution({
            marketId: marketId,
            assertionId: assertionId,
            observedValue: observedValue,
            outcomeYes: outcomeYes
        });
    }

    // Called by UMA after liveness period (or dispute resolution)
    function assertionResolvedCallback(
        bytes32 assertionId,
        bool assertedTruthfully
    ) external {
        // Find market by assertion
        // Apply payout to Conditional Tokens
        // ...
    }
}
```

---

## Patterns to Follow

### Pattern 1: Hybrid Order Book (Polymarket Model)

**What:** Off-chain order matching with on-chain settlement
**When:** Any prediction market needing capital efficiency and UX
**Why:** Pure on-chain order books are gas-prohibitive; pure off-chain is custodial risk

```
Off-chain:
- Order storage and matching
- Price discovery
- Order cancellation (free)

On-chain:
- Settlement (atomic swaps)
- Position custody (non-custodial)
- Fallback cancellation
```

**Confidence:** HIGH (Polymarket processes $9B+ volume with this architecture)

### Pattern 2: Conditional Tokens Framework (ERC1155)

**What:** Single contract manages all outcome tokens across all markets
**When:** Any prediction market with binary or multi-outcome markets
**Why:** Gas efficiency, composability, proven security

```solidity
// One contract for ALL markets
ConditionalTokens.sol
  - prepareCondition(oracle, questionId, outcomeSlotCount)
  - splitPosition(collateral, parentCollectionId, conditionId, partition, amount)
  - mergePositions(...)
  - redeemPositions(...)
```

**Confidence:** HIGH (Gnosis framework, used by Polymarket, audited)

### Pattern 3: Optimistic Oracle for Resolution

**What:** Assert outcome, allow challenge period, escalate disputes to token vote
**When:** Any oracle scenario where immediate finality isn't required
**Why:** 98.5% of assertions go undisputed (cheap), disputes resolved by economic game

```
Normal flow (98.5%):
  Assert -> Wait 2 hours -> Settle (1 tx)

Dispute flow (1.5%):
  Assert -> Dispute -> UMA DVM vote -> Settle (multiple txs, days)
```

**Confidence:** HIGH (UMA docs, though note March 2025 Polymarket incident)

### Pattern 4: Chainlink Automation for Scheduled Resolution

**What:** Decentralized keepers trigger resolution at specific times
**When:** Markets with known resolution timestamps (weather at specific time)
**Why:** No centralized cron job needed, decentralized trigger

```solidity
contract MarketResolver is AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData)
        external view returns (bool upkeepNeeded, bytes memory performData)
    {
        bytes32 marketId = abi.decode(checkData, (bytes32));
        Market memory m = markets[marketId];
        upkeepNeeded = block.timestamp >= m.targetTimestamp && !m.resolved;
        performData = checkData;
    }

    function performUpkeep(bytes calldata performData) external {
        // Trigger weather fetch and resolution
    }
}
```

**Confidence:** HIGH (Chainlink docs, widely used pattern)

### Pattern 5: Event-Driven Subgraph Indexing

**What:** Emit rich events, index with The Graph/Goldsky
**When:** Always for dApps needing queryable historical data
**Why:** Direct RPC queries don't scale; subgraphs provide GraphQL API

```solidity
// Emit RICH events - all data needed without eth_call
event Trade(
    bytes32 indexed marketId,
    address indexed trader,
    bool isBuy,
    bool isYes,
    uint256 amount,
    uint256 price,
    uint256 timestamp
);
```

**Confidence:** HIGH (The Graph docs, industry standard)

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: On-Chain Order Book

**What:** Storing and matching orders entirely on-chain
**Why bad:** Gas costs make it unusable (every order = transaction)
**Instead:** Hybrid model with off-chain matching, on-chain settlement

### Anti-Pattern 2: Single Oracle Source

**What:** Relying on one weather API for resolution
**Why bad:** Single point of failure, manipulation risk
**Instead:** Aggregate 3 sources, use median, require consensus

### Anti-Pattern 3: Custom Token per Market

**What:** Deploying new ERC20 contracts for each market's outcome tokens
**Why bad:** Gas expensive, fragmented liquidity, no composability
**Instead:** Use ERC1155 Conditional Tokens (one contract, all markets)

### Anti-Pattern 4: Synchronous Oracle Calls

**What:** Calling external API and waiting for response in same transaction
**Why bad:** Impossible in EVM (no external HTTP calls from contracts)
**Instead:** Request-response pattern with callback, or commit-reveal

### Anti-Pattern 5: Frontend Direct to Subgraph

**What:** Frontend queries The Graph directly without backend layer
**Why bad:** No auth, no rate limiting, no data enrichment
**Instead:** Backend API layer that queries subgraph, adds auth/validation

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Order Matching** | Single server | Load-balanced servers | Dedicated matching engine |
| **Subgraph Queries** | Shared hosted | Dedicated subgraph | Multiple regional subgraphs |
| **Weather API Calls** | Direct API calls | Cached with TTL | CDN + regional caching |
| **RPC Calls** | Public RPC | Dedicated RPC (Alchemy) | Multiple providers + fallback |
| **Social Data** | PostgreSQL | PostgreSQL + read replicas | Sharded DB + Redis cache |
| **Gas Costs** | Minimal concern | Batch settlements | Consider appchain |

---

## Build Order (Dependencies)

### Phase 1: Core Contracts (Foundation)
**Must build first - everything depends on this**

1. Deploy Gnosis ConditionalTokens (or use existing deployment)
2. Build MarketFactory.sol
3. Build basic WeatherOracleAdapter.sol (manual resolution)
4. Build CTFExchange.sol (fork from Polymarket)

*Dependency:* None (foundational)

### Phase 2: Oracle Infrastructure
**Enables automated resolution**

1. Weather Aggregator service (off-chain)
2. Chainlink Automation integration
3. UMA OOV3 integration for disputes

*Dependency:* Phase 1 contracts deployed

### Phase 3: Indexing Layer
**Enables efficient queries**

1. Subgraph schema design
2. Event handlers for all contracts
3. Deploy to The Graph / Goldsky

*Dependency:* Phase 1 contracts finalized (schema depends on events)

### Phase 4: Backend Services
**Enables trading UX**

1. Order matching service
2. API layer (auth, validation)
3. Social features service

*Dependency:* Phase 3 (queries subgraph)

### Phase 5: Frontend
**User-facing application**

1. Wallet connection (wagmi + RainbowKit)
2. Market browsing (reads from subgraph via backend)
3. Trading interface
4. Social features

*Dependency:* Phase 4 (API layer)

### Phase 6: Mobile
**Extended reach**

1. React Native or Progressive Web App
2. Push notifications

*Dependency:* Phase 5 (shared API)

---

## Technology Recommendations

| Layer | Recommendation | Confidence | Rationale |
|-------|---------------|------------|-----------|
| **Smart Contracts** | Solidity 0.8.20+, Foundry | HIGH | Base uses latest EVM, Foundry is standard |
| **Token Standard** | Gnosis Conditional Tokens (ERC1155) | HIGH | Industry standard, used by Polymarket |
| **Settlement** | Fork Polymarket CTF Exchange | HIGH | Audited, battle-tested |
| **Oracle (Weather)** | Custom aggregator + UMA OOV3 | MEDIUM | No native weather oracle on Base |
| **Automation** | Chainlink Automation 2.1 | HIGH | Best-in-class, native Base support |
| **Indexing** | Goldsky or The Graph Network | HIGH | Graph Hosted deprecated 2026 |
| **Backend** | Node.js + TypeScript | HIGH | Ecosystem standard |
| **Database** | PostgreSQL + Redis | HIGH | Proven for social features |
| **Frontend** | Next.js + wagmi + viem | HIGH | Industry standard for dApps |
| **Wallet** | RainbowKit | HIGH | Best UX, multi-wallet support |

---

## Open Questions (Require Phase-Specific Research)

1. **Weather API Selection:** Which 3 APIs offer best reliability + Base-compatible oracle paths?
   - AccuWeather via Chainlink node (confirmed available)
   - OpenWeather (needs custom oracle)
   - Third source TBD

2. **Dispute Bond Amount:** What USDC bond deters spam but doesn't discourage legitimate disputes?
   - UMA suggests aligning with market size
   - Need economic modeling

3. **Social Data On-Chain vs Off-Chain:** Should follows/comments have any on-chain component?
   - Tradeoff: Decentralization vs cost
   - Recommendation: Start off-chain, add attestations later

4. **Order Matching Centralization Risk:** How to mitigate operator risk in hybrid model?
   - Polymarket: On-chain cancellation as escape hatch
   - Consider: Multi-operator model for v2

---

## Sources

### HIGH Confidence (Official Documentation)
- [Base Docs - Oracles](https://docs.base.org/chain/oracles)
- [Polymarket CLOB Documentation](https://docs.polymarket.com/developers/CLOB/introduction)
- [UMA OOV3 Quick Start](https://docs.uma.xyz/developers/optimistic-oracle-v3/quick-start)
- [Gnosis Conditional Tokens GitHub](https://github.com/gnosis/conditional-tokens-contracts)
- [Chainlink Automation Documentation](https://docs.chain.link/chainlink-automation)
- [Circle USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)

### MEDIUM Confidence (Verified with Multiple Sources)
- [Polymarket Architecture Analysis](https://github.com/ahollic/polymarket-architecture)
- [AccuWeather Chainlink Node Announcement](https://corporate.accuweather.com/newsroom/blog/the-accuweather-chainlink-node-is-now-live-making-weather-based-blockchain-applications-possible/)
- [Event-Driven Development for Subgraphs - The Graph Blog](https://thegraph.com/blog/event-driven-development-unlocking-optimized-dapps-and-subgraphs/)
- [Top 5 Subgraph Indexing Platforms 2026 - Chainstack](https://chainstack.com/top-5-hosted-subgraph-indexing-platforms-2026/)
- [Wagmi Documentation](https://wagmi.sh/react/getting-started)

### LOW Confidence (Single Source / Needs Validation)
- Weather oracle aggregation patterns (custom implementation required)
- Social features architecture for prediction markets (limited precedent)
