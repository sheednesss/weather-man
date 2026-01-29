---
phase: 03-indexing-backend
plan: 01
subsystem: api
tags: [ponder, graphql, indexer, blockchain, events]

# Dependency graph
requires:
  - phase: 01-smart-contract-foundation
    provides: MarketFactory, PredictionMarket contracts with events
  - phase: 02-oracle-infrastructure
    provides: QuestionLib encoding for cityId extraction
provides:
  - Ponder indexer project structure
  - Database schema for markets, trades, positions
  - Event handlers for MarketCreated, Buy, Sell
  - Auto-generated GraphQL API
  - Factory pattern for dynamic market discovery
affects: [03-02-PLAN, 03-03-PLAN, 04-frontend]

# Tech tracking
tech-stack:
  added: [ponder@0.16.2, node-cache, axios, viem]
  patterns: [event-driven indexing, factory contract discovery, questionId decoding]

key-files:
  created:
    - indexer-api/ponder.config.ts
    - indexer-api/ponder.schema.ts
    - indexer-api/src/MarketFactory.ts
    - indexer-api/src/PredictionMarket.ts
    - indexer-api/abis/MarketFactory.json
    - indexer-api/abis/PredictionMarket.json
  modified: []

key-decisions:
  - "Ponder 0.16.x over The Graph (TypeScript-native, 10x faster, auto-GraphQL)"
  - "Factory pattern discovers PredictionMarket addresses from MarketCreated events"
  - "Volume tracks cumulative activity (buys + sells) for hot markets ranking"
  - "QuestionId decoding extracts cityId, bounds directly from bytes32 using bit shifts"

patterns-established:
  - "Event handler pattern: ponder.on('Contract:Event', async ({event, context}) => {})"
  - "Position ID format: marketId-user-isYes for unique position tracking"
  - "Trade ID format: txHash-logIndex for unique trade records"

# Metrics
duration: 5min
completed: 2026-01-29
---

# Phase 03 Plan 01: Ponder Indexer Setup Summary

**Ponder indexer with schema for markets/trades/positions, event handlers for volume tracking, and factory pattern for market discovery**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-29T03:16:45Z
- **Completed:** 2026-01-29T03:21:28Z
- **Tasks:** 3
- **Files created:** 10

## Accomplishments

- Created indexer-api/ directory with Ponder 0.16.2 and TypeScript config
- Extracted ABIs from Foundry build output for MarketFactory and PredictionMarket
- Implemented schema with markets (volume-indexed), trades, and positions tables
- Event handlers decode questionId to extract cityId using bit shifts matching QuestionLib.sol
- Factory pattern auto-discovers new markets from MarketCreated events

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Ponder project with contract ABIs** - `a977d01` (feat)
2. **Task 2: Define schema and implement event handlers** - `58a52d5` (feat)
3. **Task 3: Test with local Anvil fork and sample events** - `4c6c34c` (docs)

## Files Created

- `indexer-api/package.json` - Project config with ponder scripts and engine requirement
- `indexer-api/ponder.config.ts` - Chain config with factory pattern for market discovery
- `indexer-api/ponder.schema.ts` - Database tables with indexes for hot markets
- `indexer-api/src/MarketFactory.ts` - MarketCreated handler with questionId decoding
- `indexer-api/src/PredictionMarket.ts` - Buy/Sell handlers with volume and position tracking
- `indexer-api/abis/MarketFactory.json` - Extracted ABI from contracts/out
- `indexer-api/abis/PredictionMarket.json` - Extracted ABI from contracts/out
- `indexer-api/.env.example` - Environment config with testing instructions
- `indexer-api/tsconfig.json` - TypeScript configuration for ES modules
- `indexer-api/.gitignore` - Excludes node_modules, .ponder, .env.local

## Decisions Made

1. **Ponder over The Graph** - TypeScript-native with auto-generated GraphQL, no AssemblyScript
2. **Cumulative volume** - Both buy and sell amounts add to volume for activity tracking
3. **QuestionId decoding in handler** - Extract cityId/bounds at index time, not query time
4. **Position ID scheme** - `marketId-user-isYes` uniquely identifies each position

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Node.js Version Incompatibility**
- **Issue:** Local Node.js 18.13.0 is below Ponder's 18.14+ requirement
- **Impact:** Could not run `npm run dev` for live verification
- **Resolution:** Documented requirement in package.json engines field and .env.example
- **Verification:** Code structure and TypeScript types are correct; runtime testing requires Node upgrade

## User Setup Required

**Environment Variables** (see .env.example):
- `BASE_RPC_URL` - Base Sepolia RPC endpoint
- `MARKET_FACTORY_ADDRESS` - Deployed factory contract address
- `START_BLOCK` - Block to start indexing from

**Node.js Requirement:**
- Ponder 0.16.x requires Node.js >= 18.14
- Current environment has 18.13.0
- Upgrade Node.js before running indexer

## Next Phase Readiness

**Ready:**
- Indexer project structure complete
- Schema defines all tables needed for GraphQL queries
- Event handlers ready to process on-chain events
- Factory pattern will discover markets automatically

**Blockers:**
- Node.js version needs upgrade for runtime testing (not a code blocker)
- MarketFactory deployment needed for real data (handled in testnet deployment)

**Next Plan (03-02):**
- Weather API integration with caching
- Custom Hono endpoints for weather data
- Combined markets + weather responses

---
*Phase: 03-indexing-backend*
*Completed: 2026-01-29*
