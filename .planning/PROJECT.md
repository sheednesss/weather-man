# Weather Man

## What This Is

Weather Man is a social prediction market where users stake USDC to forecast weather outcomes and compete to become the top forecaster. Built fully on-chain on Base, it combines the mechanics of prediction markets with gamified leaderboards and social features — think Polymarket meets fantasy sports for weather nerds.

## Core Value

Users can stake real money on weather predictions and build reputation as accurate forecasters — the fun of prediction markets meets the universal appeal of weather.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Connect crypto wallet and deposit/withdraw USDC
- [ ] Browse markets by volume (hot markets) or by location
- [ ] View weather map for selected location (via weather API)
- [ ] Multiple market types per location: temperature, precipitation, wind speed
- [ ] Multiple prediction formats: binary (yes/no), range brackets, exact values
- [ ] Stake USDC on predictions with written explanation
- [ ] Parimutuel payout system (pool split among winners)
- [ ] Market resolution via aggregated data from top 3 weather APIs
- [ ] Win rate-based leaderboard ranking
- [ ] User profiles showing prediction history and stats
- [ ] Follow other forecasters
- [ ] Comments and discussion on markets
- [ ] Share predictions to Twitter/X
- [ ] Hybrid market creation (user proposals, admin curation)
- [ ] Fun, playful interface (not dry finance aesthetic)
- [ ] Web app
- [ ] Mobile app (iOS/Android)

### Out of Scope

- Native token/governance token — USDC only for v1
- Advanced trading (order books, limit orders) — simple pool-based stakes
- Real-time weather alerts/notifications — focus on predictions
- Historical weather data analysis tools — keep it simple
- Fiat on-ramp — users bring their own crypto for v1

## Context

**Inspiration:** Polymarket's prediction market mechanics combined with weather forecasting competition. Users aren't just betting — they're building reputation as skilled forecasters.

**Target audience:**
- Weather enthusiasts and hobbyists who love forecasting
- Crypto/prediction market traders looking for new markets
- Serious forecasters (meteorologists, researchers) testing their skills
- General public curious about weather betting

**Platform approach:** Web + mobile from day one, suggesting shared codebase (React + React Native/Expo).

**Chain choice:** Base (Coinbase L2) — low fees, native USDC support, easy onramps for mainstream users.

**Resolution mechanism:** Aggregate data from top 3 weather APIs for the region to reduce single-source risk. Automated resolution via oracle/backend service.

## Constraints

- **Blockchain**: Base L2 — chosen for low fees and USDC ecosystem
- **Currency**: USDC only — no native token complexity for v1
- **Architecture**: Fully on-chain — smart contracts hold funds and resolve markets
- **Data source**: Weather API aggregation (3 sources) — needs reliable oracle pattern

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Base blockchain | Low fees, native USDC, Coinbase ecosystem for easy onramps | — Pending |
| Parimutuel payouts | Simple, fair, no market maker needed | — Pending |
| Win rate for reputation | Easy to understand, rewards consistency | — Pending |
| Multi-API resolution | Reduces single source of failure risk | — Pending |
| Web + mobile simultaneously | Broad reach from launch, shared codebase viable | — Pending |

---
*Last updated: 2026-01-28 after initialization*
