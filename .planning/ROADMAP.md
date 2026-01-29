# Roadmap: Weather Man

## Overview

Weather Man delivers a fully on-chain weather prediction market in 6 phases. The journey starts with smart contract foundation on Base, adds oracle infrastructure for reliable weather resolution, builds indexing and backend services, ships a web trading MVP, then layers on social features and gamification. Each phase delivers verifiable capability that builds toward the full product: stake USDC on weather predictions, build reputation, compete on leaderboards.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Smart Contract Foundation** - Core contracts for markets, trading, and USDC custody
- [x] **Phase 2: Oracle Infrastructure** - Weather data aggregation and automated market resolution
- [x] **Phase 3: Indexing & Backend** - Event indexing, API layer, and off-chain services
- [x] **Phase 4: Web Frontend MVP** - Trading interface, wallet connection, portfolio management
- [ ] **Phase 5: Social & Profiles** - User profiles, following system, comments, sharing
- [ ] **Phase 6: Gamification** - Leaderboards, streaks, achievements, reputation

## Phase Details

### Phase 1: Smart Contract Foundation
**Goal**: Users can interact with deployed contracts that create markets, handle trades, and custody USDC on Base
**Depends on**: Nothing (first phase)
**Requirements**: WALLET-01, WALLET-02, WALLET-03, TRADE-01, TRADE-02, TRADE-03, TRADE-04, PORT-01, PORT-02
**Success Criteria** (what must be TRUE):
  1. User can connect wallet and see their USDC balance on Base Sepolia
  2. User can deposit USDC into the contract and see updated contract balance
  3. User can withdraw USDC from the contract back to their wallet
  4. User can buy YES/NO outcome shares on a test market
  5. User can sell YES/NO outcome shares back to the market
**Plans**: 3 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md — Foundry setup, CTF interfaces, Vault deposit/withdraw
- [x] 01-02-PLAN.md — MarketFactory and PredictionMarket trading contracts
- [x] 01-03-PLAN.md — Deploy to Base Sepolia and verify (testnet deployment deferred)

### Phase 2: Oracle Infrastructure
**Goal**: Markets resolve automatically using aggregated weather data from multiple API sources
**Depends on**: Phase 1
**Requirements**: MARKET-02, MARKET-03, MARKET-04, MARKET-05, MARKET-06, MARKET-07
**Success Criteria** (what must be TRUE):
  1. Oracle service fetches weather data from 3 API sources (OpenWeatherMap, Open-Meteo, Tomorrow.io)
  2. Temperature bracket markets exist for all 4 cities (NYC, Chicago, Miami, Austin)
  3. Markets resolve automatically at scheduled time using median of aggregated data
  4. Stale or conflicting data triggers fallback mechanism (not silent failure)
**Plans**: 5 plans in 2 waves

Plans:
- [x] 02-01-PLAN.md — Add market resolution to contracts, city coordinates library
- [x] 02-02-PLAN.md — Oracle service setup with 3 weather API clients
- [x] 02-03-PLAN.md — Weather aggregation, blockchain resolution, scheduler integration
- [x] 02-04-PLAN.md — CreateTemperatureMarkets script for 4 cities x 5 brackets
- [x] 02-05-PLAN.md — Market discovery service (gap closure)

### Phase 3: Indexing & Backend
**Goal**: Frontend has efficient GraphQL API for markets and positions, with weather data integration
**Depends on**: Phase 2
**Requirements**: MARKET-01, MARKET-08, WEATHER-01, WEATHER-02
**Success Criteria** (what must be TRUE):
  1. GraphQL API returns all markets with real-time pricing data
  2. User can browse markets sorted by volume (hot markets first)
  3. Current weather conditions display for each market location
  4. Weather forecast displays for each market location
**Plans**: 3 plans in 2 waves

Plans:
- [x] 03-01-PLAN.md — Ponder indexer setup, schema, event handlers for markets/trades
- [x] 03-02-PLAN.md — Weather API integration with caching, custom Hono endpoints
- [x] 03-03-PLAN.md — API documentation and end-to-end verification

### Phase 4: Web Frontend MVP
**Goal**: Users can connect wallet, browse markets, trade, and view portfolio through web interface
**Depends on**: Phase 3
**Requirements**: PLAT-01, PLAT-02
**Success Criteria** (what must be TRUE):
  1. Web app loads on desktop browsers (Chrome, Firefox, Safari)
  2. Web app is mobile-responsive (works on phone browsers)
  3. User can complete full trading flow: connect wallet, browse markets, place trade, view portfolio
  4. Portfolio shows all positions with P&L for each
**Plans**: 3 plans in 3 waves

Plans:
- [x] 04-01-PLAN.md — Vite + React + wagmi/RainbowKit setup, responsive layout
- [x] 04-02-PLAN.md — Contract ABIs, GraphQL hooks, data layer
- [x] 04-03-PLAN.md — Market browsing, trading form, portfolio with P&L

### Phase 5: Social & Profiles
**Goal**: Users can create profiles, follow forecasters, comment on markets, and share predictions
**Depends on**: Phase 4
**Requirements**: PROFILE-01, PROFILE-02, SOCIAL-01, SOCIAL-02, SOCIAL-03, SOCIAL-04, PREDICT-01
**Success Criteria** (what must be TRUE):
  1. User can create profile with display name and view other users' profiles
  2. User can follow other forecasters and see feed of their predictions
  3. User can comment on markets and see other users' comments
  4. User can write explanation with prediction and share to Twitter/X
**Plans**: 4 plans in 3 waves

Plans:
- [x] 05-01-PLAN.md — SQLite database with Drizzle ORM, SIWE authentication
- [x] 05-02-PLAN.md — Social API routes (profiles, follows, comments, predictions, feed)
- [x] 05-03-PLAN.md — Frontend SIWE authentication with useAuth hook and SignInButton
- [ ] 05-04-PLAN.md — Social UI components (profiles, follows, comments, sharing)

### Phase 6: Gamification
**Goal**: Users compete on leaderboards and earn recognition through streaks and achievements
**Depends on**: Phase 5
**Requirements**: LEADER-01, LEADER-02, GAME-01, GAME-02
**Success Criteria** (what must be TRUE):
  1. Leaderboard displays users ranked by win rate
  2. User can view top forecasters list
  3. User earns and sees streak counter for consecutive correct predictions
  4. User earns achievements/badges displayed on profile
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Smart Contract Foundation | 3/3 | Complete | 2026-01-28 |
| 2. Oracle Infrastructure | 5/5 | Complete | 2026-01-28 |
| 3. Indexing & Backend | 3/3 | Complete | 2026-01-29 |
| 4. Web Frontend MVP | 3/3 | Complete | 2026-01-29 |
| 5. Social & Profiles | 3/4 | In progress | - |
| 6. Gamification | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-28*
*Last updated: 2026-01-29 — Plan 05-03 complete*
