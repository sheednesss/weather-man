---
phase: 01-smart-contract-foundation
plan: 02
subsystem: contracts
tags: [prediction-market, ctf, gnosis, trading, cost-basis, erc1155]

# Dependency graph
requires: [01-01]
provides:
  - MarketFactory for creating prediction markets
  - PredictionMarket with buy/sell trading logic
  - PositionLib for CTF position ID calculations
  - Cost basis tracking for P&L display
affects: [01-03, frontend-portfolio]

# Tech tracking
tech-stack:
  added: []
  patterns: [CTF-integration, ERC1155-transfers, cost-basis-tracking]

key-files:
  created:
    - contracts/src/libraries/PositionLib.sol
    - contracts/src/MarketFactory.sol
    - contracts/src/PredictionMarket.sol
    - contracts/test/PredictionMarket.t.sol
    - contracts/test/mocks/MockConditionalTokens.sol
    - contracts/test/mocks/MockUSDC.sol
  modified: []

key-decisions:
  - "Factory is oracle for MVP - simplifies resolution flow"
  - "Cost basis reduced by USDC received on sell (capped at current basis)"
  - "Market keeps opposite tokens from splitPosition to enable sells"

patterns-established:
  - "CTF Integration: splitPosition for buy, mergePositions for sell"
  - "Cost Basis: Cumulative tracking per user per outcome for P&L"
  - "Pool Tracking: Separate YES/NO pools for liquidity visibility"

# Metrics
duration: 5min
completed: 2026-01-28
---

# Phase 01 Plan 02: MarketFactory and Trading Summary

**MarketFactory creates prediction markets via CTF prepareCondition; PredictionMarket enables buy/sell of YES/NO outcome tokens with cost basis tracking for P&L**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-28T19:42:04Z
- **Completed:** 2026-01-28T19:47:24Z
- **Tasks:** 3
- **Files modified:** 6 created

## Accomplishments

- PositionLib library provides CTF position ID calculations (conditionId, collectionId, positionId)
- MarketFactory creates markets via CTF prepareCondition with binary outcomes
- PredictionMarket implements buy() via splitPosition, sell() via mergePositions
- Cost basis tracking enables frontend P&L calculation (PORT-02 readiness)
- 25 new tests (41 total) including fuzz tests, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PositionLib and MarketFactory** - `3cd1512` (feat)
   - Note: Included PredictionMarket to ensure compilation
2. **Task 3: Write comprehensive market tests** - `465f1ed` (test)

## Files Created/Modified

- `contracts/src/libraries/PositionLib.sol` - CTF position ID calculations with YES_INDEX/NO_INDEX constants
- `contracts/src/MarketFactory.sol` - Factory with createMarket() calling CTF prepareCondition
- `contracts/src/PredictionMarket.sol` - Trading contract with buy/sell, cost basis, position queries
- `contracts/test/PredictionMarket.t.sol` - 25 tests covering factory, trading, cost basis, fuzz
- `contracts/test/mocks/MockConditionalTokens.sol` - Full CTF mock with ERC-1155 support
- `contracts/test/mocks/MockUSDC.sol` - 6-decimal mock token for testing

## Decisions Made

- **Factory as Oracle:** MarketFactory is the oracle address for conditions (simplifies MVP, resolution handled by factory owner)
- **Cost Basis Reduction:** On sell, cost basis is reduced by USDC received (capped at current basis) - MVP approach
- **Opposite Token Retention:** When buying YES, the market keeps the NO tokens from splitPosition to enable later sells

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test expectation for sell without opposite tokens**
- **Found during:** Task 3 test writing
- **Issue:** Test assumed no USDC return when selling without opposite tokens, but market actually has opposite tokens from the original buy's splitPosition
- **Fix:** Corrected test to expect USDC return when selling (market has matching tokens)
- **Files modified:** contracts/test/PredictionMarket.t.sol
- **Committed in:** 465f1ed

**2. [Rule 3 - Blocking] Combined Tasks 1 and 2 for compilation**
- **Found during:** Task 1
- **Issue:** MarketFactory imports PredictionMarket; both must exist for compilation
- **Fix:** Created both contracts in Task 1 commit
- **Files modified:** All three source files
- **Committed in:** 3cd1512

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** Minor restructuring, all functionality delivered

## Issues Encountered

- Foundry linter warnings about SCREAMING_SNAKE_CASE for immutables - cosmetic only, kept lowercase for readability

## User Setup Required

None - no external service configuration required for local development.

## Next Phase Readiness

- Market contracts ready for resolution flow (01-03)
- Cost basis tracking ready for frontend P&L display (PORT-02)
- CTF mock enables comprehensive testing without mainnet fork
- Security patterns (SafeERC20, ReentrancyGuard) established

---
*Phase: 01-smart-contract-foundation*
*Completed: 2026-01-28*
