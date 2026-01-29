---
phase: 04-web-frontend-mvp
plan: 02
subsystem: data-layer
tags: [graphql, hooks, wagmi, contracts, weather]
dependency-graph:
  requires: ["04-01"]
  provides: ["contract-abis", "graphql-client", "data-hooks"]
  affects: ["04-03"]
tech-stack:
  added: ["graphql-request", "graphql"]
  patterns: ["custom-hooks", "tanstack-query-caching", "bigint-transforms"]
key-files:
  created:
    - web/src/lib/contracts.ts
    - web/src/lib/graphql.ts
    - web/src/types/market.ts
    - web/src/types/position.ts
    - web/src/hooks/useMarkets.ts
    - web/src/hooks/usePositions.ts
    - web/src/hooks/useMarketsWithWeather.ts
    - web/src/hooks/useVault.ts
  modified:
    - web/.env.example
    - web/package.json
decisions:
  - id: graphql-bigint-transform
    choice: "Transform string responses to BigInt in hooks"
    reason: "GraphQL returns bigint fields as strings; typed transform ensures type safety"
  - id: wagmi-query-keys
    choice: "Use wagmi's auto-generated query keys"
    reason: "wagmi v2 useReadContract doesn't accept custom queryKey in query options"
  - id: stale-time-config
    choice: "10s markets, 5s positions, 30s weather, 60s individual weather"
    reason: "Balance freshness with API load; positions change most frequently"
metrics:
  duration: "3 min"
  completed: "2026-01-29"
---

# Phase 4 Plan 02: Data Layer Hooks Summary

Type-safe data hooks for contract interactions and API queries using graphql-request and TanStack Query caching.

## Key Deliverables

### Contract ABIs (web/src/lib/contracts.ts)
- Vault, PredictionMarket, MarketFactory ABIs as `const` for type inference
- ERC20 ABI for USDC approval flow
- Environment-based contract addresses (VAULT, MARKET_FACTORY, USDC)
- USDC_DECIMALS constant (6)

### TypeScript Types
- `Market` and `MarketWithWeather` types matching Ponder schema
- `Position` type with bigint fields for shares and costBasis
- Helper functions: `formatTemperature`, `getCityDisplayName`, `calculateYesProbability`
- `CityId` union type: 'NYC' | 'CHICAGO' | 'MIAMI' | 'AUSTIN'

### GraphQL Hooks
- `useMarkets(sortBy)` - fetches markets with volume/createdAt sorting
- `useMarket(id)` - fetches single market by address
- `usePositions()` - fetches user positions (wallet-connected)
- `useMarketPositions(marketId)` - fetches positions for specific market

### Weather Hooks
- `useMarketsWithWeather()` - fetches markets with embedded weather data
- `useWeather(cityId)` - fetches weather for individual city

### Vault Hooks
- `useVaultBalance(address)` - reads deposited balance
- `useVaultDeposit()` - deposit with transaction confirmation
- `useVaultWithdraw()` - withdraw with transaction confirmation
- `useUsdcApproval()` - approve USDC spending
- `useUsdcBalance(address)` - read USDC balance
- `useUsdcAllowance(owner)` - read USDC allowance for vault

## Technical Implementation

### BigInt Transformation Pattern
GraphQL responses return bigint fields as strings. Each hook includes a transform function:
```typescript
function transformMarket(raw: RawMarket): Market {
  return {
    ...raw,
    resolutionTime: BigInt(raw.resolutionTime),
    volume: BigInt(raw.volume),
    // etc.
  };
}
```

### TanStack Query Integration
All hooks use TanStack Query with configured staleTime:
- Markets: 10 seconds
- Positions: 5 seconds (change frequently)
- Weather: 30-60 seconds (change slowly)

### Vault Transaction Flow
Write hooks follow pattern:
1. `useWriteContract` for transaction
2. `useWaitForTransactionReceipt` for confirmation
3. `useEffect` to invalidate queries on success

## Files Created

| File | Purpose | Exports |
|------|---------|---------|
| web/src/lib/contracts.ts | Contract ABIs and addresses | vaultAbi, predictionMarketAbi, marketFactoryAbi, erc20Abi, addresses |
| web/src/lib/graphql.ts | GraphQL client | graphqlClient |
| web/src/types/market.ts | Market types | Market, MarketWithWeather, WeatherData, CityId |
| web/src/types/position.ts | Position types | Position |
| web/src/hooks/useMarkets.ts | Market hooks | useMarkets, useMarket |
| web/src/hooks/usePositions.ts | Position hooks | usePositions, useMarketPositions |
| web/src/hooks/useMarketsWithWeather.ts | Weather hooks | useMarketsWithWeather, useWeather |
| web/src/hooks/useVault.ts | Vault hooks | useVaultBalance, useVaultDeposit, useVaultWithdraw, useUsdcApproval, formatVaultBalance |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed wagmi useReadContract query options**
- **Found during:** Task 3 verification
- **Issue:** TypeScript error - queryKey not allowed in wagmi v2 useReadContract query options
- **Fix:** Removed custom queryKey from useUsdcAllowance and useUsdcBalance; wagmi auto-generates keys
- **Files modified:** web/src/hooks/useVault.ts
- **Commit:** 2763b06 (amended)

## Commits

| Hash | Message |
|------|---------|
| 8a942e4 | feat(04-02): add contract ABIs and TypeScript types |
| bf6983b | feat(04-02): add GraphQL client and market/position hooks |
| 2763b06 | feat(04-02): add weather and vault hooks |

## Success Criteria Verification

- [x] Contract ABIs extracted and typed (as const for type inference)
- [x] GraphQL client configured pointing to Ponder
- [x] useMarkets returns Market[] sorted by volume
- [x] usePositions returns Position[] for connected user
- [x] useMarketsWithWeather returns MarketWithWeather[] with weather data
- [x] useVault hooks provide balance read and deposit/withdraw write
- [x] All hooks integrate with TanStack Query caching
- [x] No TypeScript errors (npm run build succeeds)

## Next Phase Readiness

**Ready for Plan 04-03:** Market display components can now:
- Import typed hooks for data fetching
- Use contract ABIs for trading interactions
- Access weather data for market context
- Read/write vault balance with proper transaction handling

**Dependencies satisfied:**
- Contract ABIs available for trading UI
- GraphQL client ready for market queries
- Weather integration ready for display
