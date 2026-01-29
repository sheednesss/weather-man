# Phase 4: Web Frontend MVP - Research

**Researched:** 2026-01-28
**Domain:** React Web3 dApp with Wallet Integration
**Confidence:** HIGH

## Summary

This phase requires building a web frontend for a prediction market dApp on Base Sepolia. The frontend must connect to existing GraphQL/REST backends (Ponder indexer), interact with deployed smart contracts (Vault, PredictionMarket, MarketFactory), and provide a mobile-responsive trading interface.

The standard approach for React Web3 dApps in 2026 uses **wagmi v3 + viem v2** for blockchain interactions, **RainbowKit** for polished wallet connection UI, **TanStack Query** for data fetching (both GraphQL and contract reads), and **shadcn/ui + Tailwind CSS v4** for responsive UI components. This stack is well-documented, type-safe, and represents the current ecosystem standard.

The key challenge is coordinating three data sources: (1) GraphQL from Ponder for indexed data, (2) REST endpoints for weather data, and (3) direct contract reads/writes via wagmi. TanStack Query unifies caching and state management across all three.

**Primary recommendation:** Use Vite + React + TypeScript with wagmi/RainbowKit for wallet, TanStack Query for all data fetching, and shadcn/ui for mobile-responsive components.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | Industry standard, React 19 stable |
| Vite | 6.x | Build tool | Sub-second startup, fastest DX for SPAs |
| TypeScript | 5.x | Type safety | Required for wagmi type inference |
| wagmi | 2.x | React hooks for Ethereum | De facto standard, built on viem |
| viem | 2.x | Low-level Ethereum client | Replaces ethers.js, better types |
| @tanstack/react-query | 5.x | Async state management | Required by wagmi, handles all data |
| @rainbow-me/rainbowkit | 2.x | Wallet connection UI | Polished UX, supports 100+ wallets |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| graphql-request | 7.x | Lightweight GraphQL client | For Ponder GraphQL queries |
| tailwindcss | 4.x | Utility CSS framework | All styling |
| @shadcn/ui | latest | Component library | Pre-built accessible components |
| react-router-dom | 7.x | Client routing | Page navigation |
| zod | 3.x | Schema validation | Form validation, API responses |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RainbowKit | ConnectKit | ConnectKit is lighter but less actively maintained |
| RainbowKit | Custom wagmi UI | More control but 10x more code, edge cases |
| Vite | Next.js | Next.js adds SSR complexity not needed for dApp |
| shadcn/ui | Radix + custom | More work, shadcn already wraps Radix |
| graphql-request | Apollo Client | Apollo adds normalized cache complexity not needed |

**Installation:**
```bash
# Core
npm install react react-dom vite typescript

# Web3
npm install wagmi viem@2.x @tanstack/react-query @rainbow-me/rainbowkit

# Data fetching
npm install graphql-request graphql

# UI
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init

# Routing & validation
npm install react-router-dom zod
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/           # Shared UI components
│   ├── ui/              # shadcn/ui components (auto-generated)
│   ├── layout/          # Header, Footer, Layout wrappers
│   └── common/          # Button variants, Cards, etc.
├── features/            # Feature-based modules
│   ├── wallet/          # Wallet connection components
│   ├── markets/         # Market browsing, market cards
│   ├── trading/         # Buy/sell forms, order flow
│   ├── portfolio/       # Position display, P&L
│   └── weather/         # Weather display components
├── hooks/               # Custom React hooks
│   ├── useMarkets.ts    # GraphQL market queries
│   ├── usePositions.ts  # GraphQL position queries
│   ├── useWeather.ts    # REST weather queries
│   └── useContract.ts   # Contract interaction wrappers
├── lib/                 # Configuration and utilities
│   ├── wagmi.ts         # Wagmi config with chains
│   ├── graphql.ts       # GraphQL client setup
│   ├── contracts.ts     # ABI imports and addresses
│   └── utils.ts         # Formatting, calculations
├── pages/               # Route components
│   ├── Home.tsx
│   ├── Markets.tsx
│   ├── Market.tsx       # Single market detail
│   └── Portfolio.tsx
├── types/               # TypeScript types
│   ├── market.ts
│   ├── position.ts
│   └── weather.ts
├── App.tsx              # Root with providers
├── main.tsx             # Entry point
└── index.css            # Tailwind imports
```

### Pattern 1: Wagmi + RainbowKit Provider Setup
**What:** Wrap app with required providers in correct order
**When to use:** App entry point, once
**Example:**
```typescript
// src/App.tsx
// Source: https://wagmi.sh/react/getting-started
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from './lib/wagmi'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {/* App content */}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### Pattern 2: Contract Write with Confirmation
**What:** Write to contract, wait for confirmation, update UI
**When to use:** Any transaction (buy, sell, deposit, withdraw)
**Example:**
```typescript
// Source: https://wagmi.sh/react/guides/write-to-contract
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { predictionMarketAbi } from '@/lib/contracts'

function BuyButton({ marketId, isYes, amount }: Props) {
  const { data: hash, isPending, writeContract } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleBuy = () => {
    writeContract({
      address: marketId,
      abi: predictionMarketAbi,
      functionName: 'buy',
      args: [isYes, amount],
    })
  }

  return (
    <button onClick={handleBuy} disabled={isPending || isConfirming}>
      {isPending ? 'Confirm in wallet...' :
       isConfirming ? 'Confirming...' :
       isSuccess ? 'Success!' : 'Buy'}
    </button>
  )
}
```

### Pattern 3: TanStack Query with GraphQL
**What:** Fetch indexed data from Ponder GraphQL
**When to use:** Markets list, positions, trade history
**Example:**
```typescript
// src/hooks/useMarkets.ts
import { useQuery } from '@tanstack/react-query'
import { request, gql } from 'graphql-request'

const GRAPHQL_URL = 'http://localhost:42069/graphql'

const MARKETS_QUERY = gql`
  query GetMarkets {
    marketss {
      items {
        id
        cityId
        volume
        yesPool
        noPool
      }
    }
  }
`

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: () => request(GRAPHQL_URL, MARKETS_QUERY),
    staleTime: 10_000, // 10 seconds
  })
}
```

### Pattern 4: Combined Data Hook
**What:** Merge GraphQL market data with REST weather data
**When to use:** Market cards that show both price and weather
**Example:**
```typescript
// src/hooks/useMarketsWithWeather.ts
import { useQuery } from '@tanstack/react-query'

export function useMarketsWithWeather() {
  return useQuery({
    queryKey: ['markets-with-weather'],
    queryFn: async () => {
      const response = await fetch('http://localhost:42069/markets-with-weather')
      return response.json()
    },
    staleTime: 30_000, // Weather updates less frequently
  })
}
```

### Anti-Patterns to Avoid
- **Fetching in useEffect:** Use TanStack Query instead for caching, deduplication, refetching
- **Manual transaction state:** Use useWaitForTransactionReceipt, not custom useState
- **Mixing ethers.js and viem:** Stick with viem; wagmi is built on it
- **Storing wallet state in Redux:** wagmi handles all wallet state internally
- **Building custom wallet modal:** Use RainbowKit; edge cases take months to solve

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wallet connection | Custom connector logic | RainbowKit | 100+ wallets, mobile deep links, WalletConnect v2, edge cases |
| Transaction status | useState + polling | useWaitForTransactionReceipt | Handles replacements, speedups, reverts |
| Data caching | useState + useEffect | TanStack Query | Deduplication, stale-while-revalidate, refetch |
| Number formatting | Regex/manual | viem's formatUnits/parseUnits | BigInt precision, decimals |
| ABI encoding | Manual hex | viem's encodeFunctionData | Type-safe, handles complex types |
| Chain switching | window.ethereum calls | wagmi useSwitchChain | Handles all wallets uniformly |
| ENS resolution | Custom resolver | wagmi useEnsName/useEnsAvatar | Caching, batch resolution |
| Responsive breakpoints | CSS media queries | Tailwind responsive prefixes | Consistent, maintainable |

**Key insight:** Web3 UX has dozens of edge cases (network switching, transaction replacement, wallet disconnection, RPC failures). Libraries like RainbowKit and wagmi have solved these over years of production use. Custom implementations will miss edge cases that frustrate users.

## Common Pitfalls

### Pitfall 1: Network Mismatch Errors
**What goes wrong:** User's wallet is on mainnet, app expects Base Sepolia. Transactions fail silently or with cryptic errors.
**Why it happens:** Developers test on correct network, don't handle mismatch.
**How to avoid:**
- Check `useAccount().chain` against expected chain
- Use `useSwitchChain()` to prompt network switch
- Display clear "Wrong Network" UI with switch button
**Warning signs:** "contract not deployed" errors, silent transaction failures

### Pitfall 2: BigInt Formatting Errors
**What goes wrong:** Displaying raw BigInt (1000000000000000000n) instead of "1.0 ETH"
**Why it happens:** Forgetting to format, using Number() which loses precision
**How to avoid:**
- Always use `formatUnits(value, decimals)` from viem for display
- Always use `parseUnits(string, decimals)` for user input
- Never convert BigInt to Number for amounts
**Warning signs:** Very large numbers in UI, precision errors

### Pitfall 3: Stale Data After Transaction
**What goes wrong:** User buys shares, but portfolio still shows old balance
**Why it happens:** TanStack Query cache not invalidated after mutation
**How to avoid:**
- Use `queryClient.invalidateQueries()` in transaction success callback
- Or use optimistic updates for immediate feedback
```typescript
const { writeContract } = useWriteContract({
  mutation: {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    }
  }
})
```
**Warning signs:** User complaints about "not updating", refresh fixes issues

### Pitfall 4: Wallet Popup Blocking
**What goes wrong:** Transaction popup never appears, user thinks app is broken
**Why it happens:** Browser popup blockers, user clicks away
**How to avoid:**
- Always trigger transactions from direct user click (not async callback)
- Show clear "Confirm in wallet" loading state
- Consider toast notification prompting wallet check
**Warning signs:** isPending stuck true, no wallet popup

### Pitfall 5: RPC Rate Limiting
**What goes wrong:** App works locally, fails in production with 429 errors
**Why it happens:** Using public RPCs, multiple users hit rate limits
**How to avoid:**
- Use authenticated RPC from Alchemy, QuickNode, or Infura
- Configure `pollingInterval` to reduce requests
- Use Ponder GraphQL for historical data instead of RPC calls
**Warning signs:** Intermittent failures, works on refresh, 429 in console

### Pitfall 6: Mobile Wallet Deep Link Issues
**What goes wrong:** "Connect Wallet" does nothing on mobile browsers
**Why it happens:** WalletConnect requires proper deep link handling
**How to avoid:**
- Use RainbowKit which handles mobile deep links
- Set up WalletConnect projectId correctly
- Test on actual mobile devices, not just responsive mode
**Warning signs:** Desktop works, mobile doesn't connect

## Code Examples

Verified patterns from official sources:

### Wagmi Config with Base Sepolia
```typescript
// src/lib/wagmi.ts
// Source: https://wagmi.sh/react/getting-started
import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'Weather Prediction Markets',
  projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID!,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(process.env.VITE_BASE_SEPOLIA_RPC),
  },
})
```

### Contract Read Hook
```typescript
// Source: https://wagmi.sh/react/api/hooks/useReadContract
import { useReadContract } from 'wagmi'
import { vaultAbi, VAULT_ADDRESS } from '@/lib/contracts'

export function useVaultBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })
}
```

### Trading Form Component
```typescript
// src/features/trading/TradeForm.tsx
import { useState } from 'react'
import { parseUnits } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function TradeForm({ marketAddress, isYes }: Props) {
  const [amount, setAmount] = useState('')
  const { address } = useAccount()

  const { data: hash, isPending, writeContract, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return

    writeContract({
      address: marketAddress,
      abi: predictionMarketAbi,
      functionName: 'buy',
      args: [isYes, parseUnits(amount, 6)], // USDC has 6 decimals
    })
  }

  if (!address) return <ConnectButton />

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
      />
      <Button type="submit" disabled={isPending || isConfirming}>
        {isPending ? 'Confirm in wallet...' :
         isConfirming ? 'Confirming...' :
         isSuccess ? 'Success!' :
         `Buy ${isYes ? 'YES' : 'NO'}`}
      </Button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  )
}
```

### Responsive Market Card
```typescript
// src/features/markets/MarketCard.tsx
import { formatUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MarketCardProps {
  market: {
    id: string
    cityId: string
    volume: bigint
    yesPool: bigint
    noPool: bigint
  }
  weather?: {
    temperature: number
    conditions: string
  }
}

export function MarketCard({ market, weather }: MarketCardProps) {
  const totalPool = market.yesPool + market.noPool
  const yesPrice = totalPool > 0n
    ? Number(market.yesPool * 100n / totalPool)
    : 50

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl">{market.cityId}</CardTitle>
      </CardHeader>
      <CardContent>
        {weather && (
          <p className="text-sm text-muted-foreground mb-2">
            {weather.temperature}F - {weather.conditions}
          </p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-green-600 font-medium">
            YES: {yesPrice}c
          </span>
          <span className="text-red-600 font-medium">
            NO: {100 - yesPrice}c
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Volume: ${formatUnits(market.volume, 6)}
        </p>
      </CardContent>
    </Card>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ethers.js | viem | 2023 | Better types, smaller bundle, faster |
| Web3Modal v2 | RainbowKit / AppKit | 2024 | Better UX, more wallets |
| usePrepareContractWrite | useSimulateContract | wagmi v2 (2024) | Cleaner API |
| window.ethereum | EIP-6963 multiInjected | 2024 | Detects all installed wallets |
| Manual CSS breakpoints | Tailwind responsive | Ongoing | Faster development |
| Create React App | Vite | 2023 | 10x faster dev server |
| Tailwind v3 PostCSS | Tailwind v4 Vite plugin | 2025 | Simpler config |

**Deprecated/outdated:**
- **ethers.js in wagmi:** Wagmi v2+ requires viem; ethers not supported
- **usePrepareContractWrite:** Renamed to useSimulateContract in wagmi v2
- **WalletConnect v1:** Sunset, must use v2 with projectId
- **Create React App:** Abandoned by Facebook, use Vite
- **Tailwind @apply heavy usage:** Tailwind v4 prefers utility classes

## Open Questions

Things that couldn't be fully resolved:

1. **Contract Addresses**
   - What we know: ABIs ready, deployment deferred
   - What's unclear: Exact deployed addresses on Base Sepolia
   - Recommendation: Use environment variables, placeholder addresses in dev

2. **GraphQL Subscriptions for Real-Time**
   - What we know: TanStack Query doesn't natively support GraphQL subscriptions
   - What's unclear: Whether Ponder supports subscriptions
   - Recommendation: Use polling (refetchInterval) for MVP, add subscriptions in v2 if needed

3. **USDC Decimals**
   - What we know: USDC typically has 6 decimals (not 18)
   - What's unclear: Exact token contract on Base Sepolia
   - Recommendation: Verify decimals from actual contract, use constant

## Sources

### Primary (HIGH confidence)
- [Wagmi Getting Started](https://wagmi.sh/react/getting-started) - Provider setup, hooks
- [Wagmi Connect Wallet Guide](https://wagmi.sh/react/guides/connect-wallet) - Connection patterns
- [Wagmi useReadContract](https://wagmi.sh/react/api/hooks/useReadContract) - Contract read API
- [Wagmi useWriteContract](https://wagmi.sh/react/api/hooks/useWriteContract) - Contract write API
- [Wagmi useWaitForTransactionReceipt](https://wagmi.sh/react/api/hooks/useWaitForTransactionReceipt) - Transaction confirmation
- [Wagmi Chains](https://wagmi.sh/react/api/chains) - Base Sepolia configuration
- [RainbowKit Installation](https://www.rainbowkit.com/docs/installation) - Setup guide
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) - Component setup
- [TanStack Query GraphQL](https://tanstack.com/query/latest/docs/framework/react/graphql) - GraphQL integration

### Secondary (MEDIUM confidence)
- [QuickNode wagmi Guide](https://www.quicknode.com/guides/ethereum-development/dapps/building-dapps-with-wagmi) - Multi-wallet patterns
- [LogRocket GraphQL + React Query](https://blog.logrocket.com/making-graphql-requests-easy-with-react-typescript-and-react-query/) - GraphQL codegen patterns
- [Strapi Vite vs Next.js](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison) - Framework selection
- [ChainList Base Sepolia](https://chainlist.org/chain/84532) - Network details

### Tertiary (LOW confidence)
- [Medium wagmi v2 articles](https://medium.com/@mirbasit01) - Community patterns
- [Makers Den dApp Risks](https://makersden.io/blog/top-risks-for-dapp-web-frontends) - Security considerations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation from wagmi, RainbowKit, shadcn verified
- Architecture: HIGH - Patterns from official guides, widely adopted
- Pitfalls: MEDIUM - Mix of official docs and community experience

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (30 days - stack is stable)
