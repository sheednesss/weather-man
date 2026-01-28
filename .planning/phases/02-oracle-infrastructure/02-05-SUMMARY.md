---
phase: 02-oracle-infrastructure
plan: 05
subsystem: oracle
tags: [ethers, events, questionId, market-discovery, scheduler]

# Dependency graph
requires:
  - phase: 02-03
    provides: Scheduler service, blockchain service, weather aggregation
  - phase: 01-02
    provides: MarketFactory with MarketCreated event
provides:
  - Market discovery from MarketCreated chain events
  - Automatic scheduling of discovered markets
  - questionId decoding (city, bounds, resolution time)
affects: [03-trading-interface, deployment]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Read-only contract queries using provider directly
    - questionId encoding/decoding matching Solidity QuestionLib

key-files:
  created:
    - oracle-service/src/services/discovery.ts
  modified:
    - oracle-service/src/index.ts
    - oracle-service/package.json

key-decisions:
  - "Use provider directly for read-only queries (no wallet required for discovery)"
  - "Filter out past-resolution markets during discovery"
  - "Graceful handling when MARKET_FACTORY_ADDRESS not configured"

patterns-established:
  - "questionId decoding: BigInt bit shifting to match Solidity encoding"
  - "Market discovery: query all events then filter by resolution time"

# Metrics
duration: 4min
completed: 2026-01-28
---

# Phase 02 Plan 05: Market Discovery Summary

**Market discovery service that queries MarketCreated events, decodes questionId parameters, and automatically schedules markets for resolution on oracle startup**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-28T21:34:10Z
- **Completed:** 2026-01-28T21:38:10Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Oracle discovers existing markets from MarketFactory MarketCreated events on startup
- questionId decoding extracts city, temperature bounds, and resolution time (matching QuestionLib.sol)
- Discovered markets are automatically registered with scheduler for resolution
- Gap 1 from verification report is now CLOSED

## Task Commits

Each task was committed atomically:

1. **Task 1: Create market discovery service** - `fb5d51e` (feat)
2. **Task 2: Integrate discovery into oracle startup** - `dbeef32` (feat)
3. **Task 3: Test discovery with local fork** - `615520e` (chore)

## Files Created/Modified
- `oracle-service/src/services/discovery.ts` - Market discovery from chain events, questionId decoding
- `oracle-service/src/index.ts` - Discovery integration on startup, graceful handling
- `oracle-service/package.json` - Added test:discovery script

## Decisions Made
- **Read-only queries use provider directly:** No wallet required for discovery (only reading events)
- **Filter past markets:** Markets with resolution time in the past are skipped during discovery
- **Graceful degradation:** Oracle continues without markets if MARKET_FACTORY_ADDRESS not set

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - implementation matched plan specification.

## Gap Closure Status

**Gap 1 (No Market Discovery Mechanism): CLOSED**
- discoverMarkets() queries all MarketCreated events from chain
- questionId decoding extracts city, bounds, and resolution time correctly
- Discovered markets are passed to scheduleResolution on startup
- getScheduledMarkets() returns discovered markets (not empty)
- Oracle logs show discovery and scheduling activity

**Gap 2 (Markets Not Deployed): Remains DEFERRED**
- CreateTemperatureMarkets script is ready
- Deployment requires funded testnet wallet
- Consistent with PROJECT decision [01-03]
- Can be executed anytime without code changes

## Next Phase Readiness
- Oracle infrastructure is complete and ready for production use
- Market discovery connects infrastructure to actual markets
- Ready for Phase 3 (Trading Interface) or testnet deployment

---
*Phase: 02-oracle-infrastructure*
*Completed: 2026-01-28*
