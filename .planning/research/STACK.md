# Technology Stack

**Project:** Weather Man - Weather Prediction Market on Base
**Researched:** 2026-01-28
**Overall Confidence:** MEDIUM-HIGH

---

## Executive Recommendation

Build a parimutuel prediction market using **Foundry + Solidity** for smart contracts, **Vite + React + wagmi/viem** for web frontend, **React Native + Expo** for mobile, and a **custom oracle backend** aggregating weather APIs for resolution. Deploy on **Base** for low gas costs and Coinbase ecosystem integration.

---

## Smart Contract Layer

### Core Framework

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **Foundry** | v1.6.0 | Contract development, testing, deployment | HIGH | Rust-powered, 2-5x faster than Hardhat. Solidity-first testing. Industry standard for new projects in 2026. Includes Forge (build/test), Cast (CLI interactions), Anvil (local node), Chisel (REPL). |
| **Solidity** | ^0.8.24 | Smart contract language | HIGH | EVM standard. OpenZeppelin 5.x requires 0.8.24+. |
| **OpenZeppelin Contracts** | 5.4.0 | Security primitives, access control | HIGH | Battle-tested, audited. ReentrancyGuard, Ownable, Pausable essential for prediction markets. |

### Contract Architecture

| Component | Technology | Purpose | Confidence |
|-----------|------------|---------|------------|
| Market Factory | Custom Solidity | Create/manage prediction markets | HIGH |
| Parimutuel Pool | Custom Solidity | Handle stakes, calculate payouts | HIGH |
| Oracle Consumer | Chainlink + Custom | Receive weather resolution data | MEDIUM |
| USDC Integration | Circle USDC (ERC-20) | Collateral token | HIGH |

### Key Contract Addresses (Base Mainnet)

| Contract | Address | Source |
|----------|---------|--------|
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Circle Official |
| USDC (Sepolia Testnet) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Circle Official |

**Sources:**
- [Circle USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses) (HIGH confidence)
- [Base Network Information](https://docs.base.org/chain/network-information) (HIGH confidence)

---

## Frontend (Web)

### Core Framework

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **Vite** | ^6.0 | Build tool | HIGH | Sub-second startup, instant HMR, 2-5x faster builds than Next.js. dApps don't need SSR/SEO (wallet-gated). |
| **React** | ^19.0 | UI framework | HIGH | Industry standard, massive ecosystem, wagmi/viem built for React. |
| **TypeScript** | ^5.7 | Type safety | HIGH | Required for wagmi/viem type inference. Catches contract interaction bugs at compile time. |

### Blockchain Integration

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **wagmi** | ^2.17 | React hooks for Ethereum | HIGH | Official React integration for wallet/contract interactions. Built on viem. |
| **viem** | ^2.44 | TypeScript Ethereum interface | HIGH | Low-level, tree-shakable, type-safe. Modern replacement for ethers.js/web3.js. |
| **@tanstack/react-query** | ^5.90 | Server state management | HIGH | Required peer dependency for wagmi. Handles caching, refetching, optimistic updates. |

### Wallet Connection

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **RainbowKit** | ^2.3 | Wallet connection UI | HIGH | Best DX for crypto-native users. Beautiful UI, supports all major wallets. |
| **@coinbase/wallet-sdk** | ^4.3 | Coinbase Wallet support | HIGH | Essential for Base ecosystem. Native integration with Coinbase users. |

**Alternative: Privy** - Use if targeting Web2 users who need embedded wallets without existing crypto wallets. Privy handles email/social login with non-custodial embedded wallets. Choose RainbowKit for crypto-native audience, Privy for mainstream.

### UI Components

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **Tailwind CSS** | ^4.0 | Styling | HIGH | Utility-first, fast iteration, small bundle. |
| **shadcn/ui** | latest | Component library | HIGH | Accessible, customizable, copy-paste components. Not a dependency, no version lock-in. |
| **Recharts** | ^2.15 | Data visualization | MEDIUM | Leaderboards, market history charts. Declarative, React-native. |

**Sources:**
- [wagmi Documentation](https://wagmi.sh/) (HIGH confidence)
- [Viem Documentation](https://viem.sh/) (HIGH confidence)
- [Vite vs Next.js Comparison](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison) (MEDIUM confidence)

---

## Frontend (Mobile)

### Core Framework

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **React Native** | 0.77 | Cross-platform mobile | HIGH | Code sharing with web React. Large ecosystem. |
| **Expo** | SDK 53 | Development platform | HIGH | Simplifies RN development. OTA updates. EAS for builds. |

### Blockchain Integration (Mobile)

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **WalletConnect** | v2 | Mobile wallet connection | HIGH | Industry standard for mobile dApp wallet connections. Deep linking to MetaMask, Rainbow, Coinbase Wallet. |
| **@walletconnect/modal-react-native** | ^1.3 | WalletConnect UI | HIGH | Official React Native modal. |
| **thirdweb React Native SDK** | ^5.0 | Alternative integration | MEDIUM | Simpler API, ConnectButton component. Note: Expo Go not supported - requires dev builds. |

### Important Mobile Considerations

1. **No Expo Go for Web3**: Both WalletConnect and thirdweb require custom native modules incompatible with Expo Go. Use `expo prebuild` for development builds.
2. **Deep Linking**: Configure proper deep links for wallet app return flows.
3. **Shared Logic**: Extract contract interaction logic to shared packages usable by both web and mobile.

**Sources:**
- [WalletConnect React Native Guide](https://medium.com/walletconnect/how-to-build-a-react-native-dapp-with-walletconnect-28f08f332ed7) (MEDIUM confidence)
- [thirdweb React Native Docs](https://blog.thirdweb.com/web3-mobile-apps/build-web3-mobile-apps-with-react-native-on-mode/) (MEDIUM confidence)

---

## Oracle & Weather Data

### Weather API Providers (Aggregate Top 3)

| Provider | Tier | Purpose | Confidence | Why |
|----------|------|---------|------------|-----|
| **OpenWeatherMap** | Primary | Current conditions, forecasts | HIGH | Reliable, well-documented, ML-enhanced model. JSON/CSV output. |
| **Open-Meteo** | Secondary | Free, high-resolution | HIGH | Partners with national weather services. 1-11km resolution. No API key for basic usage. |
| **Tomorrow.io** | Tertiary | Hyperlocal, minute forecasts | MEDIUM | Proprietary sensing tech. Good for precipitation timing. |

**Aggregation Strategy:**
- Query all 3 APIs for each resolution
- Use median value for temperature/numerical outcomes
- Require 2/3 agreement for categorical outcomes (rain/no rain)
- Log all raw responses for dispute resolution

### Oracle Architecture

| Approach | When to Use | Confidence |
|----------|-------------|------------|
| **Custom Backend Oracle** | Recommended for weather | HIGH |
| **Chainlink Custom Data Feed** | If decentralization required | MEDIUM |
| **UMA Optimistic Oracle** | For subjective/disputed outcomes | LOW |

**Recommended: Custom Backend Oracle**

For weather data, a custom oracle backend is more appropriate than Chainlink or UMA because:
1. Weather data is objective and verifiable from multiple APIs
2. No existing Chainlink weather feeds for arbitrary locations
3. Lower cost than Chainlink custom feeds
4. Faster resolution than UMA's dispute period

**Oracle Backend Stack:**
- Node.js/Bun serverless function (Vercel/AWS Lambda)
- Scheduled job at market resolution time
- Multi-sig or time-locked admin for resolution submission
- All API responses logged to IPFS for transparency

**If Decentralization Required:**
- Use Chainlink Any API with multiple node operators
- AccuWeather has official Chainlink node (limited locations)
- Consider UMA for disputed/ambiguous weather outcomes

**Sources:**
- [OpenWeatherMap API](https://openweathermap.org/api) (HIGH confidence)
- [Open-Meteo](https://open-meteo.com/) (HIGH confidence)
- [Chainlink AccuWeather Integration](https://www.accuweather.com/en/press/chainlink-and-accuweather-to-bring-world-class-weather-data-on-to-blockchains/994046) (MEDIUM confidence)
- [Meteomatics Weather API Comparison](https://www.meteomatics.com/en/weather-api/best-weather-apis/) (MEDIUM confidence)

---

## Infrastructure

### Blockchain Network

| Network | Chain ID | Purpose | Confidence |
|---------|----------|---------|------------|
| **Base Mainnet** | 8453 | Production | HIGH |
| **Base Sepolia** | 84532 | Testing | HIGH |

### RPC Providers

| Provider | Tier | Purpose | Confidence | Why |
|----------|------|---------|------------|-----|
| **Alchemy** | Primary | Production RPC | HIGH | Reliable, good Base support, enhanced APIs (NFT, Token). |
| **QuickNode** | Secondary | Backup RPC | HIGH | Fast, global infrastructure. |
| **Public Base RPC** | Development only | Local testing | HIGH | `https://mainnet.base.org` - rate limited, NOT for production. |

**Multi-Provider Strategy Recommended:** Use Alchemy primary with QuickNode fallback. Never rely on single RPC in production.

### Indexing & Data

| Technology | Purpose | Confidence | Why |
|------------|---------|------------|-----|
| **The Graph (Subgraph)** | Event indexing | MEDIUM | Query historical markets, bets, leaderboards. Base supported. Note: Hosted service deprecated - use Graph Network or alternatives. |
| **Goldsky** | Alternative indexing | MEDIUM | Faster, real-time. Good alternative to Graph Network. |

**Note:** The Graph Hosted Service was deprecated in 2026. Options are:
1. The Graph Network (decentralized, requires GRT)
2. Goldsky (hosted, faster)
3. Ormi (hosted, Chainstack partner)

### Backend Services

| Technology | Purpose | Confidence | Why |
|------------|---------|------------|-----|
| **Vercel** | Frontend hosting, Edge functions | HIGH | Zero-config for Vite/React. Edge functions for oracle. |
| **Supabase** | User profiles, social features | MEDIUM | Auth, database, realtime subscriptions. Optional - all core data on-chain. |
| **Redis (Upstash)** | Caching, rate limiting | MEDIUM | Cache weather API responses, rate limit oracle calls. |

**Sources:**
- [Base RPC Providers 2026](https://www.quicknode.com/builders-guide/best/top-10-base-rpc-providers) (MEDIUM confidence)
- [The Graph Base Support](https://chainstack.com/top-5-hosted-subgraph-indexing-platforms-2026/) (MEDIUM confidence)

---

## Testing & Security

### Testing Stack

| Technology | Purpose | Confidence | Why |
|------------|---------|------------|-----|
| **Forge (Foundry)** | Contract unit tests | HIGH | Solidity-native tests, fast execution. |
| **Foundry Fuzz Testing** | Edge case discovery | HIGH | Built-in, input shrinking, counter-examples. |
| **Vitest** | Frontend unit tests | HIGH | Vite-native, fast, compatible with Jest API. |
| **Playwright** | E2E testing | HIGH | Cross-browser, can test wallet interactions with mocks. |

### Security Tools

| Tool | Purpose | Confidence |
|------|---------|------------|
| **Slither** | Static analysis | HIGH |
| **Mythril** | Symbolic execution | MEDIUM |
| **Foundry invariant tests** | Property-based testing | HIGH |

### Audit Preparation

Before mainnet:
1. 100% test coverage on critical paths (betting, payout, resolution)
2. Formal verification of payout math
3. Professional audit (Cyfrin, Trail of Bits, OpenZeppelin)
4. Bug bounty program (Immunefi)

---

## What NOT to Use

| Technology | Why Not | Use Instead |
|------------|---------|-------------|
| **Hardhat** | Slower compilation/testing, JS-based tests less reliable | Foundry |
| **ethers.js** | Larger bundle, less type-safe, slower updates | viem |
| **web3.js** | Legacy, poor TypeScript support, bloated | viem |
| **Next.js** | Overkill for dApp (no SEO needed), slower dev server | Vite |
| **Polymarket CTF** | Complex (CLOB + ERC-1155), overkill for weather markets | Simple parimutuel |
| **UMA Oracle** | 2-hour dispute period too slow for weather, ~$7M exploit in 2025 | Custom oracle |
| **Expo Go** | Incompatible with WalletConnect/web3 native modules | Expo dev builds |
| **Truffle** | Deprecated, unmaintained | Foundry |

---

## Installation Commands

### Smart Contracts

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize project
forge init weather-man-contracts
cd weather-man-contracts

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts@v5.4.0
forge install foundry-rs/forge-std

# Create remappings
echo "@openzeppelin/=lib/openzeppelin-contracts/" >> remappings.txt
```

### Web Frontend

```bash
# Create Vite project
npm create vite@latest weather-man-web -- --template react-ts
cd weather-man-web

# Core dependencies
npm install wagmi viem @tanstack/react-query

# Wallet connection
npm install @rainbow-me/rainbowkit @coinbase/wallet-sdk

# UI
npm install tailwindcss @tailwindcss/vite
npm install recharts

# Dev dependencies
npm install -D vitest @testing-library/react
```

### Mobile App

```bash
# Create Expo project
npx create-expo-app weather-man-mobile --template expo-template-blank-typescript
cd weather-man-mobile

# Web3 dependencies
npx expo install @walletconnect/modal-react-native
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-get-random-values
npx expo install react-native-svg

# Create development build (required for web3)
npx expo prebuild
```

---

## Version Summary

| Package | Recommended Version | Notes |
|---------|---------------------|-------|
| Foundry | v1.6.0 | Latest stable |
| Solidity | ^0.8.24 | Required by OZ 5.x |
| OpenZeppelin Contracts | 5.4.0 | Latest audited |
| React | ^19.0 | Latest stable |
| Vite | ^6.0 | Latest stable |
| wagmi | ^2.17 | Latest stable |
| viem | ^2.44 | Latest stable |
| @tanstack/react-query | ^5.90 | Latest stable |
| RainbowKit | ^2.3 | Latest stable |
| React Native | 0.77 | Latest stable |
| Expo SDK | 53 | Latest stable |

---

## Confidence Assessment Summary

| Area | Confidence | Rationale |
|------|------------|-----------|
| Smart Contract Stack | HIGH | Foundry + OZ is industry standard, well-documented |
| Web Frontend | HIGH | wagmi/viem dominant, Vite proven for dApps |
| Mobile | MEDIUM | Web3 + React Native has friction, requires dev builds |
| Weather APIs | HIGH | Multiple reliable providers, aggregation well-understood |
| Oracle Design | MEDIUM | Custom oracle recommended but adds centralization risk |
| Indexing | MEDIUM | Graph deprecation creates uncertainty, alternatives emerging |

---

## Open Questions for Phase Research

1. **Oracle Decentralization**: How much decentralization is needed? Custom oracle faster/cheaper but centralized.
2. **Dispute Resolution**: What happens if weather APIs disagree significantly?
3. **Gas Optimization**: Parimutuel payout calculations can be gas-intensive - batch processing?
4. **Mobile Wallet UX**: Deep linking flow needs testing on iOS/Android.

---

## Key Sources

### Official Documentation (HIGH Confidence)
- [Base Network Information](https://docs.base.org/chain/network-information)
- [Circle USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [OpenZeppelin Contracts 5.x](https://docs.openzeppelin.com/contracts/5.x)
- [Foundry Book](https://getfoundry.sh/)

### Technical Guides (MEDIUM Confidence)
- [Production-Ready Prediction Market Contract](https://dev.to/sivarampg/building-a-production-ready-prediction-market-smart-contract-in-solidity-complete-guide-with-2iio)
- [Polymarket Architecture](https://github.com/ahollic/polymarket-architecture)
- [Top Weather APIs 2026](https://www.xweather.com/blog/article/top-weather-apis-for-production-2026)
- [Gas Optimization Best Practices](https://hacken.io/discover/solidity-gas-optimization/)

### Ecosystem Research (LOW-MEDIUM Confidence)
- [Base dApp Development Stack](https://www.calibraint.com/blog/multi-chain-dapp-development-guide-2026)
- [UMA Oracle for Prediction Markets](https://docs.uma.xyz/developers/optimistic-oracle-v3/prediction-market)
- [Chainlink AccuWeather Node](https://corporate.accuweather.com/newsroom/blog/the-accuweather-chainlink-node-is-now-live-making-weather-based-blockchain-applications-possible/)
