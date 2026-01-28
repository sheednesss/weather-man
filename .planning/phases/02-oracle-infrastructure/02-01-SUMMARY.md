---
phase: 02-oracle-infrastructure
plan: 01
subsystem: contracts
tags: [solidity, oracle, ctf, market-resolution, coordinates]

# Dependency graph
requires:
  - phase: 01-smart-contract-foundation
    provides: MarketFactory, PredictionMarket, CTF integration, testing infrastructure
provides:
  - MarketFactory.resolveMarket() function for oracle-driven resolution
  - PredictionMarket.setResolved() to block trades post-resolution
  - CityLib with coordinates for NYC, Chicago, Miami, Austin
  - Resolution test suite (8 tests)
affects: [oracle-service, weather-api, market-lifecycle]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Factory-as-oracle pattern for market resolution"
    - "Coordinate storage with int32 scaled by 10000 for precision"
    - "Resolution blocks all trading (buy/sell) via resolved flag"

key-files:
  created:
    - contracts/src/libraries/CityLib.sol
    - contracts/test/MarketResolution.t.sol
  modified:
    - contracts/src/MarketFactory.sol
    - contracts/src/PredictionMarket.sol
    - contracts/test/mocks/MockConditionalTokens.sol

key-decisions:
  - "Coordinates scaled by 10000 in int32 for precision without floating point"
  - "Resolution flow: factory calls CTF.reportPayouts then market.setResolved"
  - "AlreadyResolved error (renamed from MarketResolved to avoid event conflict)"

patterns-established:
  - "Resolution payouts: [1,0] for YES wins, [0,1] for NO wins"
  - "Factory-only functions use custom errors (OnlyFactory, MarketNotFound)"
  - "Resolved markets reject all trades (buy and sell)"

# Metrics
duration: 6min
completed: 2026-01-28
---

# Phase 2 Plan 1: Oracle Infrastructure - Resolution Foundation Summary

**Market resolution via factory oracle with CTF reportPayouts, city coordinates for weather lookups, and comprehensive resolution test coverage**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-28T21:05:06Z
- **Completed:** 2026-01-28T21:11:32Z
- **Tasks:** 3
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- MarketFactory can resolve markets with payout arrays, blocking further trades
- City coordinates available for oracle weather API lookups (4 cities with lat/lon)
- 8 new resolution tests pass, all 41 existing tests still pass (49 total)
- Resolution flow end-to-end: factory → CTF reportPayouts → market.setResolved()

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CityLib with coordinates for 4 cities** - `f37a989` (feat)
   - Created CityLib.sol with City struct (name, lat, lon)
   - Coordinates for NYC, Chicago, Miami, Austin scaled by 10000
   - CityId enum and getCity() pure function

2. **Task 2: Add resolution functions to MarketFactory and PredictionMarket** - `7a083ed` (feat)
   - MarketFactory.resolveMarket() calls CTF reportPayouts
   - PredictionMarket.setResolved() blocks further trading
   - Added questionId to PredictionMarket for resolution

3. **Task 3: Write resolution tests** - `592878e` (test)
   - 8 tests covering resolution flow, access control, edge cases
   - CityLib coordinate verification tests
   - Fixed naming conflict (MarketResolved error → AlreadyResolved)

## Files Created/Modified
- `contracts/src/libraries/CityLib.sol` - City coordinates library with 4 cities, pure functions
- `contracts/test/MarketResolution.t.sol` - 8 resolution tests (YES/NO wins, access control, double-resolve)
- `contracts/src/MarketFactory.sol` - Added resolveMarket() function, MarketResolved event, MarketNotFound error
- `contracts/src/PredictionMarket.sol` - Added questionId, setResolved(), AlreadyResolved error, MarketResolved event
- `contracts/test/mocks/MockConditionalTokens.sol` - Added "Already resolved" check to reportPayouts

## Decisions Made

**1. Coordinate scaling with int32:**
- Rationale: Solidity doesn't support floating point, so coordinates are scaled by 10000 (40.7128 → 407128)
- Allows precise representation without decimals
- int32 sufficient for coordinate range (-180 to 180 scaled to -1800000 to 1800000)

**2. Resolution flow sequence:**
- Factory first calls CTF.reportPayouts (oracle reports outcome)
- Then calls market.setResolved() (blocks trading)
- This ensures CTF state is updated before market is locked

**3. Renamed error to avoid conflict:**
- Original: `error MarketResolved()`
- Conflict: Added `event MarketResolved(bytes32)`
- Solution: Renamed error to `AlreadyResolved()` for clarity
- Both names are semantically accurate (error = already resolved, event = just resolved)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed naming conflict between event and error**
- **Found during:** Task 3 (Writing resolution tests)
- **Issue:** Both `event MarketResolved` and `error MarketResolved` defined, causing compiler conflict
- **Fix:** Renamed error to `AlreadyResolved()` which is more descriptive
- **Files modified:** contracts/src/PredictionMarket.sol, contracts/test/MarketResolution.t.sol
- **Verification:** All 49 tests pass, forge build succeeds
- **Committed in:** 592878e (Task 3 commit)

**2. [Rule 2 - Missing Critical] Added resolution check to MockConditionalTokens**
- **Found during:** Task 3 (Test test_resolveMarket_cannotResolveAgain failing)
- **Issue:** MockConditionalTokens.reportPayouts didn't enforce "already resolved" check
- **Fix:** Added `require(_payoutDenominators[conditionId] == 0, "Already resolved")` to mock
- **Files modified:** contracts/test/mocks/MockConditionalTokens.sol
- **Verification:** test_resolveMarket_cannotResolveAgain now passes
- **Committed in:** 592878e (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correct behavior. No scope creep - naming fix improves clarity, mock fix ensures test accuracy.

## Issues Encountered

None - execution proceeded smoothly after auto-fixes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 2 Plan 2 (Oracle service implementation):**
- MarketFactory.resolveMarket() available for oracle to call
- City coordinates available via CityLib.getCity()
- Resolution flow tested and working end-to-end

**No blockers or concerns.**

---
*Phase: 02-oracle-infrastructure*
*Completed: 2026-01-28*
