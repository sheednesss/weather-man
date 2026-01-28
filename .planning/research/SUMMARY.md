# Project Research Summary

**Project:** Weather Man - Weather Prediction Market on Base
**Domain:** DeFi / Prediction Markets / Weather Data Oracles
**Researched:** 2026-01-28
**Confidence:** MEDIUM-HIGH

## Executive Summary

Weather Man is a parimutuel prediction market for weather outcomes built on Base L2. Expert-level implementations in this domain follow the Polymarket model: a hybrid architecture with off-chain order matching and on-chain settlement using Gnosis Conditional Tokens Framework (ERC-1155). The stack is Foundry + Solidity for contracts, Vite + React + wagmi/viem for web, and a custom oracle backend aggregating multiple weather APIs. Base provides low gas costs and Coinbase ecosystem integration with native USDC.

The recommended approach prioritizes security-first smart contract development before any frontend work. Core contracts (MarketFactory, CTFExchange, WeatherOracleAdapter) must be bulletproof since they custody user funds. Weather data resolution requires aggregating 3+ API sources (OpenWeatherMap, Open-Meteo, Tomorrow.io) with median calculation and staleness checks to prevent manipulation. Start with 4-6 major cities only to avoid liquidity fragmentation.

Key risks center on oracle manipulation, smart contract vulnerabilities, and regulatory compliance. Oracle risks are mitigated through multi-source aggregation and UMA's optimistic oracle for dispute resolution. Contract risks require ReentrancyGuard on all functions, Checks-Effects-Interactions pattern, and professional audit before mainnet. Regulatory risk is the wildcard: legal counsel specializing in prediction markets/derivatives is mandatory before launch. Weather markets may have an easier regulatory path than political or sports markets due to legitimate hedging use cases.

## Key Findings

### Recommended Stack

The stack converges on 2026 industry standards for EVM dApps. Foundry dominates contract development (2-5x faster than Hardhat), viem/wagmi dominate frontend blockchain integration. Base L2 is the right choice for a Coinbase-ecosystem prediction market with cheap gas and native USDC.

**Core technologies:**
- **Foundry + Solidity 0.8.24+**: Contract development - Industry standard, fast iteration, Solidity-native testing
- **OpenZeppelin Contracts 5.4.0**: Security primitives - Battle-tested ReentrancyGuard, Ownable, Pausable
- **Vite + React 19 + wagmi/viem**: Web frontend - Sub-second HMR, type-safe contract interactions
- **RainbowKit + Coinbase Wallet SDK**: Wallet connection - Best UX for crypto-native users, Base ecosystem integration
- **Custom Oracle + OpenWeatherMap/Open-Meteo/Tomorrow.io**: Weather resolution - No native Chainlink weather feeds, custom aggregation required
- **The Graph/Goldsky**: Event indexing - GraphQL API for historical markets and positions

### Expected Features

**Must have (table stakes):**
- Binary YES/NO contracts with real-time price display
- USDC wallet connection on Base chain
- Market orders with clear pricing (no complex order types)
- Portfolio view with P&L tracking
- 4 major cities (NYC, Chicago, Miami, Austin)
- NWS-based resolution with clear, objective criteria
- Mobile-responsive web interface

**Should have (differentiators):**
- Weather maps with market overlays (killer differentiator - no competitor has this)
- Temperature bracket markets (not just over/under)
- Win rate leaderboards
- User profiles and follow system
- Streak rewards and achievements

**Defer (v2+):**
- Limit orders and order book display
- API access for algorithmic trading
- Native mobile apps (web-first approach)
- Sub-city/neighborhood markets
- Non-temperature markets (rain, snow, humidity)

### Architecture Approach

Hybrid-decentralized architecture: off-chain order matching with on-chain settlement using Gnosis Conditional Tokens Framework. This is the proven Polymarket pattern processing $9B+ volume. Five distinct layers: Smart Contracts, Oracle Services, Backend Services, Indexing, and Frontend.

**Major components:**
1. **MarketFactory.sol** - Creates prediction markets, deploys conditions, registers resolution parameters
2. **CTFExchange.sol** - Atomic swaps, split/merge positions, settlement (fork Polymarket)
3. **WeatherOracleAdapter.sol** - Aggregates weather data, triggers resolution via UMA OOV3
4. **Conditional Tokens (ERC-1155)** - Single contract manages all outcome tokens across all markets
5. **Chainlink Automation** - Decentralized keepers trigger resolution at scheduled times
6. **Order Matching Service** - Off-chain order book, maker/taker matching
7. **Subgraph (Goldsky/The Graph)** - Event indexing for GraphQL queries

### Critical Pitfalls

1. **Oracle Manipulation** - Use 3+ weather API sources with median calculation; implement staleness checks (reject data >1 hour old); log all raw responses to IPFS for transparency
2. **Smart Contract Reentrancy** - Apply OpenZeppelin ReentrancyGuard with nonReentrant modifier on ALL functions; follow Checks-Effects-Interactions strictly; use pull-payment pattern
3. **Ambiguous Resolution Criteria** - Define exact data source, coordinates (not city name), Unix timestamps, and rounding rules in both contract and UI; avoid subjective markets entirely
4. **Access Control Flaws** - Use 3/5 multi-sig for admin operations; implement 24-48 hour timelocks on sensitive functions; separate roles (pauser, upgrader, fee-collector)
5. **Regulatory Non-Compliance** - Engage legal counsel before any code; geo-block US users if not CFTC-registered; document "information market" use case

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Smart Contract Foundation
**Rationale:** Everything depends on secure, correct contracts. Architecture research confirms Polymarket's hybrid model is proven. Cannot build anything else until contracts are deployed.
**Delivers:** MarketFactory, CTFExchange, basic WeatherOracleAdapter, deployed to Base Sepolia
**Addresses:** Binary YES/NO contracts, USDC integration
**Avoids:** Reentrancy (ReentrancyGuard from day 1), Access Control (multi-sig from day 1)

### Phase 2: Oracle Infrastructure
**Rationale:** Markets are useless without reliable resolution. Oracle manipulation is top attack vector. Must be rock-solid before any real money.
**Delivers:** Weather aggregator service, Chainlink Automation integration, UMA OOV3 dispute fallback
**Uses:** OpenWeatherMap, Open-Meteo, Tomorrow.io APIs; Chainlink Automation 2.1
**Implements:** WeatherOracleAdapter with multi-source aggregation, staleness checks
**Avoids:** Oracle manipulation, stale data, single source dependency

### Phase 3: Indexing Layer
**Rationale:** Frontend needs efficient queries. Cannot build UI without GraphQL API for markets/positions.
**Delivers:** Subgraph schema, event handlers, deployed to Goldsky or The Graph Network
**Implements:** Event-driven architecture from ARCHITECTURE.md
**Avoids:** Frontend direct to RPC (doesn't scale)

### Phase 4: Backend Services
**Rationale:** Trading UX requires order matching service. Social features need database.
**Delivers:** Order matching service, API layer with auth/validation, basic social service
**Uses:** Node.js + TypeScript, PostgreSQL + Redis
**Implements:** Hybrid order book pattern

### Phase 5: Web Frontend MVP
**Rationale:** User-facing application. All dependencies (contracts, oracle, indexing, backend) must be ready.
**Delivers:** Wallet connection, market browsing, trading interface, portfolio view
**Uses:** Vite + React + wagmi/viem, RainbowKit, Tailwind + shadcn/ui
**Addresses:** All table stakes features for web

### Phase 6: Differentiators
**Rationale:** Core product works; now add competitive advantages.
**Delivers:** Weather maps with market overlays, leaderboards, user profiles, gamification
**Addresses:** All differentiator features from FEATURES.md

### Phase 7: Mobile
**Rationale:** Extended reach after web is proven.
**Delivers:** React Native app with WalletConnect, push notifications
**Uses:** React Native 0.77 + Expo SDK 53 (dev builds required for web3)

### Phase Ordering Rationale

- **Contracts before everything** - All other layers depend on deployed, tested contracts. Cannot even test frontend without contract ABIs.
- **Oracle before frontend** - Markets without resolution are worthless. Oracle complexity is highest-risk area.
- **Indexing before frontend** - Direct RPC queries don't scale. Frontend depends on GraphQL.
- **Web before mobile** - Web is faster to iterate, same API serves both. Mobile adds complexity (dev builds, WalletConnect).
- **Differentiators after MVP** - Weather maps are killer feature but not required for initial traction. Prove core loop first.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Oracle):** Complex integration between off-chain aggregator and on-chain adapter; UMA OOV3 has specific integration patterns; weather API response formats need validation
- **Phase 4 (Backend):** Order matching service has centralization risks; need to research Polymarket's escape-hatch patterns for on-chain cancellation

Phases with standard patterns (skip research-phase):
- **Phase 1 (Contracts):** Foundry + OpenZeppelin patterns well-documented; CTF is established
- **Phase 3 (Indexing):** The Graph/Goldsky patterns are mature
- **Phase 5 (Frontend):** wagmi/viem/RainbowKit have excellent docs and examples

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Foundry + wagmi/viem is industry standard; official docs are comprehensive |
| Features | MEDIUM | Based on Polymarket/Kalshi patterns; weather-specific differentiators less proven |
| Architecture | MEDIUM-HIGH | Polymarket hybrid model proven at scale; weather oracle aggregation is custom |
| Pitfalls | HIGH | Well-documented vulnerabilities; Polymarket disputes and Augur failures provide clear lessons |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Oracle decentralization level:** Research didn't resolve how much decentralization is acceptable. Custom oracle is faster/cheaper but centralized. May need community input.
- **Dispute bond economics:** UMA suggests aligning bond with market size. Needs economic modeling during Phase 2 planning.
- **Mobile wallet deep linking:** WalletConnect + React Native has friction. Needs hands-on testing during Phase 7.
- **Weather API cost at scale:** Free tiers won't work in production. Need to model API costs vs revenue during Phase 2.
- **Graph Network vs Goldsky:** Hosted service deprecated. Need to evaluate cost/complexity tradeoff during Phase 3.

## Sources

### Primary (HIGH confidence)
- [Base Docs - Network Information](https://docs.base.org/chain/network-information)
- [Circle USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [OpenZeppelin Contracts 5.x](https://docs.openzeppelin.com/contracts/5.x)
- [Foundry Book](https://getfoundry.sh/)
- [UMA OOV3 Quick Start](https://docs.uma.xyz/developers/optimistic-oracle-v3/quick-start)
- [Chainlink Automation Documentation](https://docs.chain.link/chainlink-automation)
- [Gnosis Conditional Tokens GitHub](https://github.com/gnosis/conditional-tokens-contracts)

### Secondary (MEDIUM confidence)
- [Polymarket CLOB Documentation](https://docs.polymarket.com/developers/CLOB/introduction)
- [Polymarket Architecture Analysis](https://github.com/ahollic/polymarket-architecture)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Open-Meteo](https://open-meteo.com/)
- [Kalshi Weather Trading Guide](https://news.kalshi.com/p/trading-the-weather)
- [OWASP Smart Contract Top 10 2025](https://owasp.org/www-project-smart-contract-top-10/)
- [Chainlink Oracle Security Guide](https://chain.link/resources/blockchain-oracle-security)

### Tertiary (LOW confidence)
- Weather oracle aggregation patterns (custom implementation required, limited precedent)
- Social features architecture for prediction markets (limited prior art)
- React Native + WalletConnect integration (community guides, needs validation)

---
*Research completed: 2026-01-28*
*Ready for roadmap: yes*
