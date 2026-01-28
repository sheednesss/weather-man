---
phase: 02-oracle-infrastructure
verified: 2026-01-28T21:22:49Z
status: gaps_found
score: 10/13 must-haves verified
gaps:
  - truth: "Markets resolve automatically at scheduled time using median of aggregated data"
    status: failed
    reason: "Oracle service has no mechanism to discover or schedule markets"
    artifacts:
      - path: "oracle-service/src/index.ts"
        issue: "scheduleResolution imported but never called - no market discovery"
    missing:
      - "Market discovery mechanism (chain event listener or API)"
      - "Automatic registration of markets with scheduler"
      - "Integration between CreateTemperatureMarkets and oracle service"
  - truth: "Temperature bracket markets exist for all 4 cities"
    status: partial
    reason: "Script exists but markets haven't been deployed - no actual markets on-chain"
    artifacts:
      - path: "contracts/script/CreateTemperatureMarkets.s.sol"
        issue: "Script exists and compiles, but needs deployment to create actual markets"
    missing:
      - "Deployment of markets (script needs to be run)"
      - "Verification that 20 markets (4 cities x 5 brackets) are deployed"
  - truth: "Stale or conflicting data triggers fallback mechanism (not silent failure)"
    status: verified
    reason: "Fallback mechanism exists and logs errors appropriately"
    note: "Verified - logs FALLBACK TRIGGERED when < 2/3 sources, logs RESOLUTION FAILED when aggregation returns null"
---

# Phase 02: Oracle Infrastructure Verification Report

**Phase Goal:** Markets resolve automatically using aggregated weather data from multiple API sources

**Verified:** 2026-01-28T21:22:49Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Oracle service fetches weather data from 3 API sources | ✓ VERIFIED | All 3 providers exist with fetch functions (OpenWeatherMap, Open-Meteo, Tomorrow.io) |
| 2 | All 3 API clients can fetch temperature data | ✓ VERIFIED | Each provider exports async function returning TemperatureReading, uses retry client |
| 3 | Weather service aggregates 3 APIs and calculates median | ✓ VERIFIED | weather.ts has calculateMedian, aggregateTemperature calls all 3 providers |
| 4 | Blockchain service can resolve markets on-chain | ✓ VERIFIED | blockchain.ts has resolveMarket calling factory.resolveMarket with gas estimation |
| 5 | Scheduler runs resolution at configured times | ✓ VERIFIED | scheduler.ts uses node-cron with UTC timezone, scheduleResolution function exists |
| 6 | Fallback triggers when fewer than 2/3 APIs succeed | ✓ VERIFIED | weather.ts checks validReadings.length < 2, logs FALLBACK TRIGGERED, returns null |
| 7 | MarketFactory can resolve markets with payouts array | ✓ VERIFIED | MarketFactory.resolveMarket exists, calls CTF reportPayouts then market.setResolved |
| 8 | Resolved markets reject new trades | ✓ VERIFIED | PredictionMarket has setResolved function (from 02-01) |
| 9 | City coordinates are available for oracle lookups | ✓ VERIFIED | CityLib has all 4 cities with lat/lon coordinates |
| 10 | questionId format encodes city and bracket for oracle parsing | ✓ VERIFIED | QuestionLib has encodeQuestionId and decodeQuestionId functions |
| 11 | **Markets resolve automatically at scheduled time** | **✗ FAILED** | **scheduleResolution exists but never called - no market discovery mechanism** |
| 12 | **Temperature bracket markets exist for all 4 cities** | **⚠️ PARTIAL** | **Script exists but markets not deployed - requires manual deployment** |
| 13 | At least 3 brackets per city available (12+ markets total) | ✓ VERIFIED | QuestionLib.getStandardBrackets returns 5 brackets, script creates 4x5=20 markets |

**Score:** 10/13 truths verified (77%)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `contracts/src/MarketFactory.sol` | resolveMarket function | ✓ VERIFIED | Lines 114-135, calls reportPayouts and setResolved |
| `contracts/src/libraries/CityLib.sol` | City coordinates for 4 cities | ✓ VERIFIED | 66 lines, has NYC, CHICAGO, MIAMI, AUSTIN with lat/lon |
| `oracle-service/src/services/weather.ts` | Weather aggregation with median | ✓ VERIFIED | 48 lines, calculateMedian function, aggregateTemperature |
| `oracle-service/src/services/blockchain.ts` | Contract interaction | ✓ VERIFIED | 88 lines, resolveMarket, getMarketFactoryContract |
| `oracle-service/src/services/scheduler.ts` | Cron scheduling | ✓ VERIFIED | 66 lines, uses node-cron, scheduleResolution function |
| `oracle-service/src/index.ts` | Entry point | ✓ VERIFIED | 52 lines, has healthCheck and main |
| `oracle-service/src/providers/openweathermap.ts` | OpenWeatherMap client | ✓ VERIFIED | 31 lines, exports fetchFromOpenWeatherMap |
| `oracle-service/src/providers/openmeteo.ts` | Open-Meteo client | ✓ VERIFIED | 31 lines, exports fetchFromOpenMeteo |
| `oracle-service/src/providers/tomorrow.ts` | Tomorrow.io client | ✓ VERIFIED | 32 lines, exports fetchFromTomorrowIo |
| `contracts/src/libraries/QuestionLib.sol` | Question ID encoding | ✓ VERIFIED | 67 lines, encodeQuestionId and decodeQuestionId |
| `contracts/script/CreateTemperatureMarkets.s.sol` | Market creation script | ✓ VERIFIED | 95 lines, creates 20 markets (4 cities x 5 brackets) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| weather.ts | 3 providers | fetch functions | ✓ WIRED | Lines 24-26 call all 3 providers with Promise.all |
| weather.ts | calculateMedian | aggregation | ✓ WIRED | Line 43 calls calculateMedian on valid readings |
| blockchain.ts | MarketFactory.resolveMarket | ethers.js | ✓ WIRED | Line 80 calls factory.resolveMarket with conditionId and payouts |
| scheduler.ts | weather.ts | aggregateTemperature | ✓ WIRED | Line 22 calls aggregateTemperature(market.city) |
| scheduler.ts | blockchain.ts | resolveMarket | ✓ WIRED | Lines 30-35 call resolveMarket with weather.median |
| index.ts | services | initialization | **✗ NOT_WIRED** | **scheduleResolution imported but never called** |
| CreateTemperatureMarkets | MarketFactory | createMarket | ✓ WIRED | Line 47 calls factory.createMarket(questionId, resolutionTime) |
| MarketFactory | CTF | reportPayouts | ✓ WIRED | Line 129 calls conditionalTokens.reportPayouts |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| MARKET-02: Markets resolve using aggregated weather API data (top 3 sources) | ⚠️ BLOCKED | No market discovery - scheduler never populated |
| MARKET-03: Temperature bracket markets available | ⚠️ BLOCKED | Script exists but markets not deployed |
| MARKET-04: Markets available for NYC | ⚠️ BLOCKED | Script can create but not deployed |
| MARKET-05: Markets available for Chicago | ⚠️ BLOCKED | Script can create but not deployed |
| MARKET-06: Markets available for Miami | ⚠️ BLOCKED | Script can create but not deployed |
| MARKET-07: Markets available for Austin | ⚠️ BLOCKED | Script can create but not deployed |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| oracle-service/src/index.ts | 5 | Import but never use | 🛑 Blocker | scheduleResolution imported but never called - markets won't be scheduled |
| oracle-service/src/index.ts | 40-43 | Comment indicates missing functionality | ⚠️ Warning | "In production, markets would be loaded from chain events or database" - not implemented |
| oracle-service/src/index.ts | 43 | Always empty array | 🛑 Blocker | getScheduledMarkets() always returns [] because nothing calls scheduleResolution |

### Gaps Summary

**Gap 1: No Market Discovery Mechanism**

The oracle service has all the pieces (weather aggregation, blockchain resolution, scheduler) but no way to discover markets and populate the scheduler. The infrastructure is complete but disconnected from actual markets.

**Evidence:**
- scheduleResolution imported in index.ts line 5 but never called
- Comment on line 40: "In production, markets would be loaded from chain events or database"
- getScheduledMarkets() on line 43 always returns empty array

**What's missing:**
1. Market discovery service (listen to MarketCreated events or query factory)
2. Automatic registration: When CreateTemperatureMarkets runs, oracle should detect and schedule
3. Integration between contract deployment and oracle service initialization

**Gap 2: Markets Not Actually Deployed**

The CreateTemperatureMarkets script exists and is correct, but markets haven't been deployed. QuestionLib and CityLib exist, but no actual markets are on-chain.

**Evidence:**
- Script compiles and is ready to run
- No deployment artifacts or verification that markets exist
- Would create 20 markets (4 cities x 5 brackets) when run

**What's missing:**
1. Deployment of CreateTemperatureMarkets script to testnet/mainnet
2. Verification that 20 markets actually exist on-chain
3. Market addresses and conditionIds for oracle to monitor

---

_Verified: 2026-01-28T21:22:49Z_
_Verifier: Claude (gsd-verifier)_
