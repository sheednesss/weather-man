# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Users can stake real money on weather predictions and build reputation as accurate forecasters
**Current focus:** Phase 6 - Gamification (next)

## Current Position

Phase: 5 of 6 complete
Plan: N/A (between phases)
Status: Ready for Phase 6
Last activity: 2026-01-29 - Phase 5 verified and complete

Progress: [===================□] 95%

## Performance Metrics

**Velocity:**
- Total plans completed: 18
- Average duration: 4.4 min
- Total execution time: 1.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-smart-contract-foundation | 3 | 13 min | 4.3 min |
| 02-oracle-infrastructure | 4 | 16 min | 4.0 min |
| 03-indexing-backend | 3 | 24 min | 8.0 min |
| 04-web-frontend-mvp | 3 | 12 min | 4.0 min |
| 05-social-profiles | 4 | 17 min | 4.3 min |

**Recent Trend:**
- Last 5 plans: 05-01 (5 min), 05-02 (2 min), 05-03 (2 min), 05-04 (8 min)
- Trend: Consistent

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
- [03-02]: 15-minute cache TTL for weather data (balance freshness vs rate limits)
- [03-02]: City coordinates as decimals for direct Open-Meteo API use
- [03-02]: WMO weather codes mapped to human-readable descriptions
- [04-01]: wagmi v2 + RainbowKit (not v3) for peer dependency compatibility
- [04-01]: react-router-dom v6 (not v7) for Node 18 compatibility
- [04-01]: Tailwind v4 with @tailwindcss/vite plugin (not PostCSS)
- [04-01]: ConnectButton.Custom for compact mobile wallet display
- [04-02]: Transform string responses to BigInt in hooks (GraphQL returns bigint as strings)
- [04-02]: wagmi v2 useReadContract doesn't accept custom queryKey in query options
- [04-02]: staleTime: 10s markets, 5s positions, 30s weather (balance freshness vs load)
- [04-03]: Feature-based folder structure (features/markets, features/trading, features/portfolio)
- [04-03]: Price calculation: yesPool * 100 / totalPool (0-100 cents display)
- [04-03]: P&L: currentValue - costBasis with percentage display
- [04-03]: Query invalidation on successful trades (markets, positions, markets-with-weather)
- [05-01]: Drizzle ORM for type-safe social database queries
- [05-01]: SQLite via better-sqlite3 (separate from Ponder internal DB)
- [05-01]: SIWE with viem verifyMessage for wallet authentication
- [05-01]: Encrypted cookie sessions (stateless, no session store)
- [05-01]: All addresses stored lowercase for consistency
- [05-02]: leftJoin profiles in queries to return results even without profile data
- [05-02]: innerJoin for feed to filter only followed users' predictions
- [05-02]: Upsert pattern for profile updates (insert...onConflictDoUpdate)
- [05-03]: API client uses credentials: 'include' for cross-origin cookie support
- [05-03]: SIWE message uses Base Sepolia chainId 84532
- [05-03]: Session query 30s staleTime for balance of freshness and API load
- [05-04]: react-share library for Twitter/X sharing (simple API, handles intent URLs)
- [05-04]: ProfileCard component reused across feed, comments, and profile pages
- [05-04]: Query invalidation on follow/unfollow for real-time count updates
- [05-04]: ShareButton appears after successful trade (not before)

### Pending Todos

None yet.

### Blockers/Concerns

- Node.js version issue RESOLVED - installed fnm and Node 20.20.0 for Ponder
- Testnet deployment still requires funded wallet (deferred from Phase 1)
- Node 18 works for Vite despite engine warnings

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 05-04-PLAN.md (Phase 5 complete)
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

## Phase 3 Summary

**Status:** Complete (3/3 plans, all success criteria verified)

**Plan 03-01 Complete:** Ponder indexer setup
- indexer-api/ project with Ponder 0.16.2
- Schema: markets, trades, positions with volume index
- Event handlers: MarketCreated, Buy, Sell with volume tracking
- Factory pattern auto-discovers new markets
- GraphQL API auto-generated at http://localhost:42069

**Plan 03-02 Complete:** Weather API integration
- Weather fetching with 15-minute NodeCache TTL
- City coordinates matching CityLib.sol (4 cities)
- Custom Hono routes: /weather/:cityId, /weather, /markets-with-weather
- WMO weather code mapping for descriptions

**Plan 03-03 Complete:** API documentation and verification
- Comprehensive README.md with all API documentation
- GraphQL middleware properly configured
- All endpoints verified: GraphQL, weather, markets-with-weather
- Cache behavior confirmed (126ms → 17ms on cache hit)
- Error handling verified (400 for invalid cityId)

**Key Files:**
- indexer-api/ponder.config.ts - Chain/contract configuration
- indexer-api/ponder.schema.ts - Database schema
- indexer-api/src/MarketFactory.ts - MarketCreated handler
- indexer-api/src/PredictionMarket.ts - Buy/Sell handlers
- indexer-api/src/lib/weather.ts - Weather fetching with caching
- indexer-api/src/lib/cities.ts - City coordinates
- indexer-api/src/api/index.ts - Custom Hono routes + GraphQL middleware
- indexer-api/README.md - Complete API documentation

**Success Criteria Met:**
- [x] GraphQL API returns markets with real-time pricing (yesPool/noPool)
- [x] Markets can be sorted by volume (hot markets)
- [x] Current weather displays for each market location
- [x] Weather forecast displays for each market location

## Phase 4 Summary

**Status:** Complete (3/3 plans, all success criteria verified)

**Plan 04-01 Complete:** Project Setup and Wallet Connection
- Vite + React + TypeScript project in web/
- wagmi v2 + RainbowKit for Base Sepolia wallet connection
- Tailwind v4 with @tailwindcss/vite plugin
- Responsive layout with sticky header and mobile menu
- React Router routes: /, /markets, /portfolio

**Plan 04-02 Complete:** Data Layer Hooks
- Contract ABIs extracted from compiled contracts (as const for type inference)
- GraphQL client with graphql-request for Ponder queries
- useMarkets, usePositions hooks with bigint transformation
- useMarketsWithWeather hook for REST endpoint
- useVault hooks for balance read and deposit/withdraw write
- TanStack Query caching with configured staleTime

**Plan 04-03 Complete:** Trading UI Components
- Market browsing with MarketCard and MarketList
- Trading form with YES/NO selection and transaction states
- Market detail page at /markets/:id
- Portfolio view with positions and P&L calculation
- Feature-based folder structure (markets/, trading/, portfolio/)

**Key Files:**
- web/src/lib/wagmi.ts - Wagmi config for Base Sepolia
- web/src/lib/contracts.ts - Contract ABIs and addresses
- web/src/lib/graphql.ts - GraphQL client
- web/src/types/market.ts - Market and WeatherData types
- web/src/types/position.ts - Position type
- web/src/hooks/useMarkets.ts - Market fetching hooks
- web/src/hooks/usePositions.ts - Position fetching hooks
- web/src/hooks/useMarketsWithWeather.ts - Weather integration hooks
- web/src/hooks/useVault.ts - Vault interaction hooks
- web/src/hooks/useTrade.ts - Trading hooks (useBuy, useSell)
- web/src/features/markets/MarketCard.tsx - Market card component
- web/src/features/markets/MarketList.tsx - Market list component
- web/src/features/markets/MarketDetail.tsx - Market detail component
- web/src/features/trading/TradeForm.tsx - Trading form component
- web/src/features/portfolio/PositionCard.tsx - Position card with P&L
- web/src/features/portfolio/PositionList.tsx - Position list component
- web/src/App.tsx - Root component with providers
- web/src/components/layout/Header.tsx - Navigation with ConnectButton
- web/src/pages/Home.tsx, Markets.tsx, Market.tsx, Portfolio.tsx - Page components

**Success Criteria Met:**
- [x] Web app loads on desktop browsers
- [x] Web app is mobile-responsive
- [x] User can complete full trading flow (connect, browse, trade, view portfolio)
- [x] Portfolio shows all positions with P&L

## Phase 5 Summary

**Status:** Complete (4/4 plans, all success criteria verified)

**Plan 05-01 Complete:** Database and Auth Foundation
- Drizzle ORM with SQLite for social data storage
- Schema: profiles, follows, comments, predictions tables
- SIWE authentication with encrypted cookie sessions
- Wallet address verification via viem verifyMessage

**Plan 05-02 Complete:** Social API Routes
- Profile CRUD routes (GET/PUT /social/profiles/:address)
- Follow system routes (POST/DELETE /social/follow/:address)
- Comments routes (GET/POST /social/markets/:marketId/comments)
- Predictions routes (GET/POST /social/markets/:marketId/predictions)
- Feed route (GET /social/feed) for followed users' predictions

**Plan 05-03 Complete:** Frontend SIWE Authentication
- API client with credentials: 'include' for cookie support
- useAuth hook managing session state
- SignInButton component with SIWE signature flow
- Session persistence across page refreshes

**Plan 05-04 Complete:** Frontend Social Components
- Social data hooks (useProfile, useFollow, useComments, usePredictions)
- Profile view/edit with ProfilePage and ProfileCard components
- Follow/unfollow with FollowButton component
- Market comments with CommentList and CommentForm
- Prediction explanations in TradeForm
- Twitter/X sharing with react-share ShareButton
- Feed page for followed users' predictions
- Routes: /profile/:address, /feed

**Key Files:**
- indexer-api/src/db/schema.ts - Drizzle social schema
- indexer-api/src/db/index.ts - Database connection
- indexer-api/src/api/social.ts - Social API routes
- indexer-api/src/api/auth.ts - SIWE authentication routes
- web/src/lib/api.ts - API client with credentials
- web/src/hooks/useAuth.ts - Authentication hook
- web/src/hooks/useProfile.ts - Profile hooks
- web/src/hooks/useFollow.ts - Follow hooks
- web/src/hooks/useComments.ts - Comments hooks
- web/src/hooks/usePredictions.ts - Predictions and feed hooks
- web/src/features/social/*.tsx - Social UI components

**Success Criteria Met:**
- [x] User can create profile with display name (PROFILE-01)
- [x] User can view other users' profiles (PROFILE-02)
- [x] User can follow other forecasters (SOCIAL-01)
- [x] User can see feed of followed forecasters' predictions (SOCIAL-02)
- [x] User can comment on markets (SOCIAL-03)
- [x] User can share prediction to Twitter/X (SOCIAL-04)
- [x] User can write explanation with prediction (PREDICT-01)
