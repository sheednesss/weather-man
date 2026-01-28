# Feature Landscape: Weather Prediction Markets

**Domain:** Social prediction market for weather outcomes (crypto/blockchain)
**Researched:** 2026-01-28
**Confidence:** MEDIUM (based on WebSearch cross-verified across multiple sources)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or unusable.

### Core Trading Features

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Binary YES/NO contracts** | Foundation of prediction markets - Polymarket, Kalshi both use this model | Medium | Share prices 0-100 cents, pay $1 on correct outcome |
| **Real-time price/odds display** | Users need to see current probability before trading | Low | Prices reflect aggregated probability consensus |
| **Order execution (market orders)** | Users expect to trade instantly at displayed price | Medium | Must handle USDC on Base chain |
| **Position tracking/portfolio** | Users must see their current holdings and P&L | Medium | Show open positions, unrealized gains, entry prices |
| **Market resolution with clear rules** | Trust requires knowing exactly when/how markets resolve | High | Weather markets need NWS/NOAA as resolution source (Kalshi pattern) |
| **Wallet connection (USDC on Base)** | Crypto prediction markets require blockchain wallet | Medium | Standard for Polymarket, required for USDC staking |
| **Market browsing/discovery** | Users need to find markets of interest | Low | Filter by location, date, market type |
| **Trade history** | Users expect record of their past trades | Low | Essential for tax and personal tracking |

### Weather-Specific Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Location-based markets** | Weather is inherently local - users care about their area | Medium | Major cities first (Kalshi offers NYC, Chicago, Miami, Austin) |
| **Daily temperature markets** | Most common weather bet type across platforms | Low | "Will high temp exceed X degrees?" format |
| **Clear data source attribution** | Weather resolution needs official source | Low | National Weather Service Daily Climate Reports |
| **Multiple timeframes** | Users want to predict today, tomorrow, weekly | Medium | Daily is core; monthly/seasonal are extensions |

### UX Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Mobile-responsive design** | 60%+ of trading happens on mobile; Polymarket optimized for mobile browser | Medium | Not native app initially, but mobile-first web |
| **Instant visual feedback** | Modern apps provide immediate response to actions | Low | Animations, confirmations, loading states |
| **Clear pricing/fee display** | Users distrust hidden fees | Low | Show what they'll pay before confirming |
| **Transaction confirmation** | Blockchain transactions need clear status | Medium | Pending/confirmed states, tx hash links |

---

## Differentiators

Features that set Weather Man apart. Not expected, but create competitive advantage.

### Weather-Unique Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Weather maps with market overlays** | Combines weather app UX with market discovery - no competitor does this | High | Killer feature: visual map showing markets by location with temps/odds overlaid |
| **Multiple prediction formats** | Go beyond binary: brackets (temp ranges), ranges, over/under | Medium | Kalshi uses binary only; ranges add sophistication for weather |
| **Parimutuel payouts** | Pool-based odds mean payouts scale with prediction difficulty | High | Thales protocol pattern; different from order book model |
| **Radar/precipitation visualization** | Weather app UX expectation brought to prediction market | High | Integrate weather API data with market visualization |
| **Hyper-local markets** | Neighborhood-level weather predictions, not just city | High | Differentiates from Kalshi's 4-city model |

### Social/Community Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Win rate leaderboards** | Shows skilled forecasters, creates aspirational gameplay | Medium | BettorEdge, Manifold both have leaderboards; Kalshi shows top profit winners |
| **Follow forecasters** | Social discovery of skilled predictors | Medium | Pariflow has "Follow" features; Manifold is social-first |
| **Comments on markets** | Discussion increases engagement and surfaces insights | Medium | Metaculus pattern: users discuss prediction strategies |
| **Twitter/X sharing** | Viral growth through prediction sharing | Low | Polymarket has X partnership; sharing individual predictions |
| **Forecaster profiles** | Public track record builds reputation and trust | Medium | Metaculus scores users on prediction accuracy |

### Gamification Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Streak rewards** | Daily engagement incentive; proven retention driver | Medium | Manifold gives M5-M25 daily quest rewards; betting apps use streak counters |
| **Achievements/badges** | Milestone recognition (first correct prediction, 10-day streak, etc.) | Medium | 2026 trend: betting platforms adding badges, levels, progress tracking |
| **Seasonal competitions** | Time-limited challenges drive periodic engagement | Medium | Metaculus runs quarterly tournaments with prizes |
| **Prediction accuracy score** | Long-term skill metric beyond win rate | High | Metaculus scores "being more right than the community" |

### Playful/Fun Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Fun, casual interface** | Counter to sterile trading UX - approachable for general public | Medium | Key differentiator from Kalshi/Polymarket's financial aesthetic |
| **Weather-themed visuals** | Sun/rain/snow animations tied to market outcomes | Medium | Weather apps known for beautiful, whimsical design |
| **Prediction reactions** | Emoji reactions to big wins/surprising weather | Low | Social engagement mechanic |

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Complex order types (limit, GTC, FOK, FAK)** | Overwhelming for casual users; adds technical complexity | Start with simple market orders only; add limit orders later if demand exists |
| **Full order book display** | Intimidating to non-traders; unnecessary for parimutuel model | Show simple buy/sell prices; hide market microstructure |
| **Leverage/margin trading** | Regulatory risk, user protection issues, complexity | Stick to straightforward USDC staking with 1:1 exposure |
| **Algorithmic trading APIs (initially)** | Attracts bots that discourage retail users; creates unfair advantages | Focus on human-friendly experience first; APIs come later with safeguards |
| **Infinite scroll of markets** | Dark pattern; shown to cause addictive behavior | Use pagination or curated categories; respect digital wellbeing |
| **Auto-play animations everywhere** | Distracting; reduces clarity of weather/odds information | Use motion purposefully for feedback, not decoration |
| **Subjective/hard-to-resolve markets** | Resolution disputes destroy trust (see UMA oracle attacks on Polymarket) | Only weather markets with objective NWS/NOAA data sources |
| **Too many cities at launch** | Spreads liquidity thin; markets need volume to function | Start with 4-6 major cities like Kalshi; expand based on demand |
| **Native mobile apps (initially)** | High development cost; app store approval complexity for crypto/betting | Mobile-first web (Polymarket pattern); native apps as later milestone |
| **Play money / fake currency** | Undermines seriousness; no real stakes | Real USDC from day one; play money is different product (Manifold's niche) |
| **Sports betting or non-weather markets** | Regulatory landmines; dilutes weather focus | Stay laser-focused on weather; regulatory clarity exists for weather markets |
| **Complex fee structures** | Confuses users; erodes trust | Simple, transparent fee (percentage of winnings or flat per-trade) |
| **Anonymous trading only** | Misses social features opportunity; can't build leaderboards | Support optional public profiles for social features |

---

## Feature Dependencies

```
Foundation Layer (must build first):
  Wallet Connection
       |
       v
  Market Browsing --> Market Detail View --> Trading (Buy/Sell)
       |                    |                      |
       v                    v                      v
  Location Filter    Price Display           Portfolio View
                           |                      |
                           v                      v
                    Resolution Rules        Trade History

Social Layer (requires foundation):
  User Profiles (optional public)
       |
       +---> Leaderboards (requires trade history)
       |
       +---> Follow System (requires profiles)
       |
       +---> Comments (requires profiles + market detail)
       |
       +---> Sharing (requires market detail)

Weather UX Layer (can parallel foundation):
  Weather Data API Integration
       |
       +---> Map Visualization
       |         |
       |         v
       |     Market Overlays on Map
       |
       +---> Radar/Precipitation Display
       |
       +---> Weather Icons in Market Cards

Gamification Layer (requires social + foundation):
  Achievement System
       |
       +---> Badges (requires trade history)
       |
       +---> Streaks (requires daily login tracking)
       |
       +---> Accuracy Score (requires resolved predictions)
       |
       +---> Seasonal Competitions (requires leaderboards)

Advanced Trading (defer):
  Limit Orders --> Order Book --> API Access
```

---

## MVP Recommendation

For MVP, prioritize:

### Must Have (Week 1-4)
1. **Wallet connection + USDC on Base** - Foundation for all trading
2. **Binary weather markets** - "Will NYC high exceed 50F tomorrow?" format
3. **Simple buy/sell flow** - Market orders only, clear pricing
4. **Portfolio view** - Current positions and P&L
5. **4 major cities** - NYC, Chicago, Miami, Austin (mirrors Kalshi's proven approach)
6. **NWS-based resolution** - Clear, verifiable, objective

### Should Have (Week 5-8)
7. **Location-based browsing** - Find markets by city
8. **Mobile-responsive UI** - Polymarket proves this is sufficient
9. **Trade history** - Past trades and outcomes
10. **Basic weather map** - Show markets on interactive map (key differentiator)
11. **Temperature bracket markets** - Not just over/under, but "30-40F", "40-50F" ranges

### Nice to Have (Post-MVP)
12. **Leaderboards** - Win rate rankings
13. **User profiles** - Optional public profiles
14. **Follow system** - Track favorite forecasters
15. **Streaks/achievements** - Gamification layer
16. **Comments** - Market-level discussion
17. **Sharing to X** - Viral growth mechanism
18. **Parimutuel conversion** - Shift from order book to pool-based

### Defer to Later
- **Limit orders** - Complexity without clear user demand
- **API access** - Bot protection comes first
- **Native mobile apps** - Web-first approach proven by Polymarket
- **Sub-city locations** - Liquidity must prove out at city level first
- **Non-temperature markets** - Rain, snow, humidity as expansion

---

## Competitor Feature Matrix

| Feature | Polymarket | Kalshi | Metaculus | Manifold | Weather Man Target |
|---------|------------|--------|-----------|----------|-------------------|
| Real money | Yes (USDC) | Yes (USD) | No | No (Mana) | Yes (USDC) |
| Weather markets | Limited | Yes (4 cities) | Occasional | User-created | Core focus |
| Order book | Yes (CLOB) | Yes | N/A | AMM | Simple (parimutuel) |
| Leaderboards | No | Yes (profit) | Yes (accuracy) | Yes | Yes |
| Social follow | No | No | Limited | Yes | Yes |
| Mobile app | Web only | iOS/Android | Web | iOS/Android | Web-first |
| Map visualization | No | No | No | No | Yes (differentiator) |
| Comments | Limited | No | Yes | Yes | Yes |
| Gamification | No | No | Points/quests | Daily quests | Streaks/badges |

---

## Sources

### Prediction Market Features (MEDIUM confidence - multiple sources agree)
- [Polymarket Documentation](https://docs.polymarket.com/)
- [Polymarket Order Book Guide](https://docs.polymarket.com/polymarket-learn/trading/using-the-orderbook)
- [PokerNews Polymarket Review 2026](https://www.pokernews.com/prediction-markets/polymarket/)
- [Finextra: Top 5 Prediction Market Platforms 2026](https://www.finextra.com/blogposting/30551/top-5-prediction-market-platforms-to-keep-an-eye-on-in-2026)

### Weather Betting Specifics (MEDIUM confidence - Kalshi data verified)
- [BettingUSA Weather Prediction Markets](https://www.bettingusa.com/prediction-markets/weather/)
- [Kalshi Weather Trading Guide](https://news.kalshi.com/p/trading-the-weather)
- [Sportsbookreview Weather Betting](https://www.sportsbookreview.com/picks/novelty/weather-betting/)

### Weather App UX (MEDIUM confidence - design best practices)
- [Core77 Weather App Design Analysis](https://www.core77.com/posts/109456/Good-and-Bad-Design-in-Weather-Apps)
- [Eleken Map UI Design Best Practices](https://www.eleken.co/blog-posts/map-ui-design)
- [Clustox Weather App Development Guide 2026](https://www.clustox.com/blog/weather-app-development-guide/)

### Social/Gamification Features (MEDIUM confidence - multiple platforms)
- [Manifold Markets FAQ](https://docs.manifold.markets/faq)
- [Metaculus Platform](https://www.metaculus.com/)
- [Smartico Gamification in Sports Betting](https://www.smartico.ai/blog-post/gamification-in-sports-betting)
- [Innosoft Group Sports Betting Features 2026](https://innosoft-group.com/top-5-must-have-features-every-modern-sports-betting-platform-needs-for-player-retention-in-2026/)

### Parimutuel/Blockchain (MEDIUM confidence - technical documentation)
- [Thales Protocol](https://thalesmarket.io/)
- [Blocmates: Thales Architecture](https://www.blocmates.com/articles/thales-the-architecture-for-parimutuel-markets-and-derivatives)
- [UMA Oracle Resolution](https://rocknblock.io/blog/how-prediction-markets-resolution-works-uma-optimistic-oracle-polymarket)

### Anti-Patterns and Mistakes (LOW-MEDIUM confidence)
- [Whales Market: Common Prediction Market Mistakes](https://whales.market/blog/common-mistakes-on-prediction-market/)
- [NN/g State of UX 2026](https://www.nngroup.com/articles/state-of-ux-2026/)
- [Plotline: Streaks for Gamification](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
