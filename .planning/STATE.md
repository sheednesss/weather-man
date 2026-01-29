# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Users can stake real money on weather predictions and build reputation as accurate forecasters
**Current focus:** Phase 3 - Indexing & Backend

## Current Position

Phase: 3 of 6 (Indexing & Backend)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-01-29 - Completed 03-01-PLAN.md (Ponder indexer setup)

Progress: [==========          ] 47%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 4.2 min
- Total execution time: 0.56 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-smart-contract-foundation | 3 | 13 min | 4.3 min |
| 02-oracle-infrastructure | 4 | 16 min | 4.0 min |
| 03-indexing-backend | 1 | 5 min | 5.0 min |

**Recent Trend:**
- Last 5 plans: 02-02 (3 min), 02-03 (4 min), 02-05 (4 min), 03-01 (5 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 6 phases derived from 32 requirements (standard depth)
- [Roadmap]: Mobile deferred to v2 (web-only for v1)
- [Roadmap]: Social features included in v1 scope (Phase 5)
- [01-01]: OpenZeppelin v5.4.0 for latest security patterns
- [01-01]: Custom errors over require strings for gas efficiency
- [01-01]: SafeERC20 + ReentrancyGuard + CEI pattern established
- [01-02]: Factory is oracle for MVP - simplifies resolution flow
- [01-02]: Cost basis reduced by USDC received on sell (capped at current basis)
- [01-02]: Market keeps opposite tokens from splitPosition to enable sells
- [01-03]: Testnet deployment deferred - can be done later when wallet is funded
- [01-03]: SimpleConditionalTokens created as MVP alternative to Gnosis CTF
- [02-01]: Coordinates scaled by 10000 in int32 for precision without floating point
- [02-01]: Resolution flow: factory calls CTF.reportPayouts then market.setResolved
- [02-01]: AlreadyResolved error (renamed from MarketResolved to avoid event conflict)
- [02-03]: Median temperature calculation (more resistant to outliers than mean)
- [02-03]: 2 of 3 weather source quorum (balance between reliability and availability)
- [02-03]: fs.readFileSync for ABI import (Node 18 compatibility vs import attributes)
- [02-03]: 1 minute delay after resolution time (ensures weather APIs have updated data)
- [02-05]: Read-only contract queries use provider directly (no wallet for discovery)
- [02-05]: Filter past-resolution markets during discovery
- [02-05]: Graceful handling when MARKET_FACTORY_ADDRESS not configured
- [03-01]: Ponder 0.16.x over The Graph (TypeScript-native, auto-GraphQL)
- [03-01]: Factory pattern discovers PredictionMarket addresses from MarketCreated events
- [03-01]: Volume tracks cumulative activity (buys + sells) for hot markets ranking
- [03-01]: QuestionId decoding extracts cityId, bounds directly from bytes32 using bit shifts

### Pending Todos

None yet.

### Blockers/Concerns

- Node.js version (18.13.0) below Ponder requirement (18.14+) - needs upgrade for runtime testing

## Session Continuity

Last session: 2026-01-29T03:21:28Z
Stopped at: Completed 03-01-PLAN.md (Ponder indexer setup)
Resume file: None

## Phase 1 Summary

**Status:** Complete (verified 5/5 must-haves)
**Tests:** 41 passing (16 Vault + 25 PredictionMarket)
**Contracts:**
- Vault.sol - USDC deposit/withdraw
- MarketFactory.sol - Market creation via CTF
- PredictionMarket.sol - Buy/sell with cost basis tracking
- SimpleConditionalTokens.sol - MVP CTF implementation
- PositionLib.sol - CTF position ID calculations

**Deferred:** Testnet deployment (scripts ready, needs funded wallet)

## Phase 2 Summary

**Status:** Complete (gaps closed)
**Oracle Service:** Fully operational TypeScript service

**Plan 02-01 Complete:** Market resolution foundation
- MarketFactory.resolveMarket() for oracle-driven resolution
- CityLib with coordinates for 4 cities (NYC, Chicago, Miami, Austin)
- 8 resolution tests, all 49 tests passing

**Plan 02-02 Complete:** Oracle service setup
- TypeScript project with weather provider abstraction
- 3 weather API clients (OpenWeatherMap, Open-Meteo, Tomorrow.io)
- Consistent TemperatureReading interface

**Plan 02-03 Complete:** Weather aggregation and blockchain resolution
- Weather service aggregates 3 APIs with median calculation
- Blockchain service resolves markets on-chain via ethers.js
- Scheduler coordinates resolution at configured times

**Plan 02-05 Complete:** Market discovery (gap closure)
- discoverMarkets() queries MarketCreated events from chain
- questionId decoding extracts city, bounds, resolution time
- Automatic registration of discovered markets with scheduler
- Gap 1 CLOSED: Oracle now discovers and schedules markets

**Gap 2 Deferred:** Market deployment (consistent with PROJECT decision [01-03])
- CreateTemperatureMarkets script ready
- Deployment requires funded testnet wallet
- Can be executed anytime without code changes

## Phase 3 Summary (In Progress)

**Status:** 1/3 plans complete

**Plan 03-01 Complete:** Ponder indexer setup
- indexer-api/ project with Ponder 0.16.2
- Schema: markets, trades, positions with volume index
- Event handlers: MarketCreated, Buy, Sell with volume tracking
- Factory pattern auto-discovers new markets
- GraphQL API auto-generated at http://localhost:42069

**Key Files:**
- indexer-api/ponder.config.ts - Chain/contract configuration
- indexer-api/ponder.schema.ts - Database schema
- indexer-api/src/MarketFactory.ts - MarketCreated handler
- indexer-api/src/PredictionMarket.ts - Buy/Sell handlers

**Next:** 03-02 Weather API integration with caching
