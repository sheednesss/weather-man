# Requirements: Weather Man

**Defined:** 2026-01-28
**Core Value:** Users can stake real money on weather predictions and build reputation as accurate forecasters

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Wallet & Trading

- [x] **WALLET-01**: User can connect crypto wallet on Base chain
- [x] **WALLET-02**: User can deposit USDC to platform
- [x] **WALLET-03**: User can withdraw USDC from platform
- [x] **TRADE-01**: User can buy YES outcome shares on a market
- [x] **TRADE-02**: User can sell YES outcome shares on a market
- [x] **TRADE-03**: User can buy NO outcome shares on a market
- [x] **TRADE-04**: User can sell NO outcome shares on a market
- [x] **PORT-01**: User can view portfolio of held positions
- [x] **PORT-02**: User can see P&L for each position

### Markets

- [x] **MARKET-01**: Markets display real-time pricing
- [x] **MARKET-02**: Markets resolve using aggregated weather API data (top 3 sources)
- [x] **MARKET-03**: Temperature bracket markets available (e.g., 80-85°F, 85-90°F, 90+°F)
- [x] **MARKET-04**: Markets available for NYC
- [x] **MARKET-05**: Markets available for Chicago
- [x] **MARKET-06**: Markets available for Miami
- [x] **MARKET-07**: Markets available for Austin
- [x] **MARKET-08**: User can browse markets by volume (hot markets)

### Weather UX

- [x] **WEATHER-01**: Display current weather conditions for market locations
- [x] **WEATHER-02**: Display weather forecast for market locations

### Social & Gamification

- [x] **PROFILE-01**: User can create profile with display name
- [x] **PROFILE-02**: User can view other users' profiles
- [ ] **LEADER-01**: Leaderboard ranks users by win rate
- [ ] **LEADER-02**: User can view top forecasters
- [x] **SOCIAL-01**: User can follow other forecasters
- [x] **SOCIAL-02**: User can see feed of followed forecasters' predictions
- [x] **SOCIAL-03**: User can comment on markets
- [x] **SOCIAL-04**: User can share prediction to Twitter/X
- [x] **PREDICT-01**: User can write explanation with prediction
- [ ] **GAME-01**: User earns streaks for consecutive correct predictions
- [ ] **GAME-02**: User earns achievements/badges

### Platform

- [x] **PLAT-01**: Web app is mobile-responsive
- [x] **PLAT-02**: Web app works on desktop browsers

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Trading

- **ADV-01**: User can place limit orders
- **ADV-02**: User can view order book
- **ADV-03**: API access for algorithmic trading

### Enhanced Weather UX

- **WXUX-01**: Interactive weather maps with market overlays
- **WXUX-02**: Location-based market browsing (pick city, see all markets)

### Extended Markets

- **EXT-01**: Rain/precipitation markets
- **EXT-02**: Snow markets
- **EXT-03**: Wind speed markets
- **EXT-04**: Additional cities beyond initial 4

### Mobile

- **MOB-01**: Native iOS app
- **MOB-02**: Native Android app
- **MOB-03**: Push notifications for market resolution

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native token/governance token | USDC only — avoids token complexity for v1 |
| Fiat on-ramp | Users bring their own crypto — simplifies regulatory |
| Order book / limit orders | Simple market orders for v1 — reduces complexity |
| Real-time chat | Comments sufficient for social interaction |
| Sub-city/neighborhood markets | Start with city-level to ensure liquidity |
| Historical weather data analysis | Focus on predictions, not analysis tools |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WALLET-01 | Phase 1, 4 | Complete |
| WALLET-02 | Phase 1 | Complete |
| WALLET-03 | Phase 1 | Complete |
| TRADE-01 | Phase 1 | Complete |
| TRADE-02 | Phase 1 | Complete |
| TRADE-03 | Phase 1 | Complete |
| TRADE-04 | Phase 1 | Complete |
| PORT-01 | Phase 1 | Complete |
| PORT-02 | Phase 1 | Complete |
| MARKET-01 | Phase 3 | Complete |
| MARKET-02 | Phase 2 | Complete |
| MARKET-03 | Phase 2 | Complete |
| MARKET-04 | Phase 2 | Complete |
| MARKET-05 | Phase 2 | Complete |
| MARKET-06 | Phase 2 | Complete |
| MARKET-07 | Phase 2 | Complete |
| MARKET-08 | Phase 3 | Complete |
| WEATHER-01 | Phase 3 | Complete |
| WEATHER-02 | Phase 3 | Complete |
| PROFILE-01 | Phase 5 | Complete |
| PROFILE-02 | Phase 5 | Complete |
| LEADER-01 | Phase 6 | Pending |
| LEADER-02 | Phase 6 | Pending |
| SOCIAL-01 | Phase 5 | Complete |
| SOCIAL-02 | Phase 5 | Complete |
| SOCIAL-03 | Phase 5 | Complete |
| SOCIAL-04 | Phase 5 | Complete |
| PREDICT-01 | Phase 5 | Complete |
| GAME-01 | Phase 6 | Pending |
| GAME-02 | Phase 6 | Pending |
| PLAT-01 | Phase 4 | Complete |
| PLAT-02 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-29 — Phases 1-5 complete (28/32 requirements done)*
