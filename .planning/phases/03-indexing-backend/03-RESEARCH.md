# Phase 3: Indexing & Backend - Research

**Researched:** 2026-01-28
**Domain:** Blockchain indexing, GraphQL API, weather data integration
**Confidence:** HIGH

## Summary

This phase requires building a backend that indexes on-chain prediction market events and serves them via GraphQL, while integrating weather data for market display. Research confirms **Ponder** as the ideal blockchain indexer for this TypeScript-based project - it's 10x faster than The Graph, provides end-to-end type safety, auto-generates a GraphQL API, and runs in Node.js where we can easily integrate weather API calls.

The existing oracle-service already has weather API clients (OpenWeatherMap, Open-Meteo, Tomorrow.io) with coordinate-based lookups matching CityLib's 4 cities. The backend can reuse these providers directly or reference their patterns for weather data caching.

For "hot markets" ranking, the standard approach in prediction markets (per Polymarket's architecture) is tracking `scaledCollateralVolume` on each market entity and sorting by this field. We'll index Buy/Sell events to maintain volume counters.

**Primary recommendation:** Use Ponder for indexing with its auto-generated GraphQL API, add custom Hono endpoints for weather data, and store in PostgreSQL for production (PGlite for development).

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ponder | 0.16.x | Blockchain event indexer | 10x faster than Graph, TypeScript-native, auto-GraphQL, hot-reload dev |
| @pothos/core | latest | GraphQL schema builder (if extending) | Type-safe schema building, zero-overhead |
| graphql-yoga | latest | GraphQL server runtime | Built into Ponder, SSE subscriptions, HTTP/2 support |
| hono | built-in | HTTP routing for custom endpoints | Already bundled with Ponder for custom API routes |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| viem | bundled | Chain interaction | Included with Ponder, type-safe contract reads |
| node-cache | ^5.x | In-memory weather caching | TTL-based cache for weather API responses |
| axios | ^1.7.x | HTTP client | Already in oracle-service, reuse for weather fetching |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Ponder | The Graph | The Graph is decentralized but 10x slower, requires AssemblyScript, no custom logic |
| Ponder | Custom ethers.js indexer | Full control but must handle reorgs, persistence, GraphQL manually |
| Ponder | Envio HyperIndex | Good multichain support but less TypeScript-native than Ponder |
| PGlite | SQLite | SQLite is simpler but Ponder requires Postgres-compatible database |

**Installation:**
```bash
# In new indexer-api/ directory
npm init ponder@latest

# Additional dependencies
npm install node-cache axios
```

## Architecture Patterns

### Recommended Project Structure
```
indexer-api/
├── ponder.config.ts       # Chains, contracts, addresses
├── ponder.schema.ts       # Database tables (markets, positions, trades)
├── src/
│   ├── MarketFactory.ts   # MarketCreated event handler
│   ├── PredictionMarket.ts # Buy/Sell event handlers
│   ├── SimpleConditionalTokens.ts # Transfer events (optional)
│   └── api/
│       └── index.ts       # Hono routes: GraphQL + /weather endpoints
├── abis/
│   ├── MarketFactory.json
│   ├── PredictionMarket.json
│   └── SimpleConditionalTokens.json
└── lib/
    └── weather.ts         # Weather fetching with caching
```

### Pattern 1: Event-Driven Indexing with Ponder
**What:** Register handlers for each contract event that update database tables
**When to use:** Always - this is Ponder's core pattern
**Example:**
```typescript
// Source: https://ponder.sh/docs/api-reference/ponder/indexing-functions
import { ponder } from "ponder:registry";
import { markets, trades } from "ponder:schema";

ponder.on("MarketFactory:MarketCreated", async ({ event, context }) => {
  await context.db.insert(markets).values({
    id: event.args.market,
    conditionId: event.args.conditionId,
    questionId: event.args.questionId,
    resolutionTime: event.args.resolutionTime,
    createdAt: event.block.timestamp,
    volume: 0n,
    yesPool: 0n,
    noPool: 0n,
  });
});

ponder.on("PredictionMarket:Buy", async ({ event, context }) => {
  // Insert trade record
  await context.db.insert(trades).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    marketId: event.log.address,
    user: event.args.user,
    amount: event.args.amount,
    isYes: event.args.isYes,
    timestamp: event.block.timestamp,
  });

  // Update market volume
  const market = await context.db.find(markets, { id: event.log.address });
  if (market) {
    await context.db.update(markets, { id: event.log.address }).set({
      volume: market.volume + event.args.amount,
      yesPool: event.args.isYes ? market.yesPool + event.args.amount : market.yesPool,
      noPool: event.args.isYes ? market.noPool : market.noPool + event.args.amount,
    });
  }
});
```

### Pattern 2: Factory Contract Discovery
**What:** Use Ponder's factory() to discover dynamically-created PredictionMarket contracts
**When to use:** When MarketFactory deploys new markets
**Example:**
```typescript
// Source: https://ponder.sh/docs/api-reference/config
import { createConfig, factory } from "ponder";
import { MarketFactoryAbi } from "./abis/MarketFactory";
import { PredictionMarketAbi } from "./abis/PredictionMarket";

export default createConfig({
  chains: {
    base: {
      id: 8453,
      rpc: process.env.BASE_RPC_URL,
    },
  },
  contracts: {
    MarketFactory: {
      abi: MarketFactoryAbi,
      chain: "base",
      address: process.env.MARKET_FACTORY_ADDRESS as `0x${string}`,
      startBlock: Number(process.env.START_BLOCK) || 0,
    },
    PredictionMarket: {
      abi: PredictionMarketAbi,
      chain: "base",
      address: factory({
        address: process.env.MARKET_FACTORY_ADDRESS as `0x${string}`,
        event: MarketFactoryAbi.find(e => e.name === "MarketCreated")!,
        parameter: "market",
      }),
      startBlock: Number(process.env.START_BLOCK) || 0,
    },
  },
});
```

### Pattern 3: Custom API Endpoints with Hono
**What:** Add weather endpoints alongside auto-generated GraphQL
**When to use:** For non-indexed data like weather that comes from external APIs
**Example:**
```typescript
// Source: https://ponder.sh/docs/api-reference/ponder/api-endpoints
// src/api/index.ts
import { Hono } from "hono";
import { db } from "ponder:api";
import { graphql } from "ponder";
import * as schema from "ponder:schema";
import { getWeather } from "../lib/weather";

const app = new Hono();

// Auto-generated GraphQL API
app.use("/graphql", graphql({ schema }));
app.use("/", graphql({ schema }));

// Custom weather endpoint
app.get("/weather/:cityId", async (c) => {
  const cityId = c.req.param("cityId");
  const weather = await getWeather(cityId);
  return c.json(weather);
});

// Markets with weather (combined endpoint)
app.get("/markets-with-weather", async (c) => {
  const markets = await db.select().from(schema.markets).orderBy(desc(schema.markets.volume));
  const marketsWithWeather = await Promise.all(
    markets.map(async (m) => ({
      ...m,
      weather: await getWeather(m.cityId),
    }))
  );
  return c.json(marketsWithWeather);
});

export default app;
```

### Pattern 4: Weather Caching with TTL
**What:** Cache weather API responses to avoid rate limits and improve latency
**When to use:** Always for external API data
**Example:**
```typescript
// lib/weather.ts
import NodeCache from "node-cache";
import axios from "axios";

// 15-minute TTL for weather data
const weatherCache = new NodeCache({ stdTTL: 900 });

interface WeatherData {
  temperature: number;
  conditions: string;
  forecast: ForecastDay[];
}

export async function getWeather(cityId: string): Promise<WeatherData | null> {
  const cached = weatherCache.get<WeatherData>(cityId);
  if (cached) return cached;

  const city = CITIES[cityId];
  if (!city) return null;

  try {
    // Use Open-Meteo (free, no API key required)
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=7&temperature_unit=fahrenheit`
    );

    const weather: WeatherData = {
      temperature: response.data.current.temperature_2m,
      conditions: weatherCodeToCondition(response.data.current.weather_code),
      forecast: response.data.daily.time.map((date: string, i: number) => ({
        date,
        high: response.data.daily.temperature_2m_max[i],
        low: response.data.daily.temperature_2m_min[i],
        conditions: weatherCodeToCondition(response.data.daily.weather_code[i]),
      })),
    };

    weatherCache.set(cityId, weather);
    return weather;
  } catch (error) {
    console.error(`Weather fetch failed for ${cityId}:`, error);
    return null;
  }
}
```

### Anti-Patterns to Avoid

- **Polling for events:** Use Ponder's event-driven indexing, not ethers.js polling loops
- **Storing weather in indexed tables:** Weather is external data with TTL; cache it, don't persist in blockchain-indexed DB
- **Custom GraphQL resolvers for indexed data:** Use Ponder's auto-generated GraphQL; only add custom endpoints for external data
- **Skipping factory pattern:** If MarketFactory creates markets dynamically, you must use Ponder's factory() or miss new markets

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event indexing | Custom ethers.js event loop | Ponder | Reorg handling, persistence, typing, 10x faster |
| GraphQL API | Apollo Server from scratch | Ponder's auto-generated API | Zero config, type-safe, included |
| Hot-reload development | Custom file watchers | Ponder dev server | Built-in, handles schema changes |
| Database migrations | Manual SQL | Ponder schema.ts | Auto-managed, declarative |
| Weather caching | Custom Map/setTimeout | node-cache | TTL handling, cleanup, proven |

**Key insight:** Ponder exists specifically because hand-rolling blockchain indexers is error-prone (reorgs, RPC failures, state management). The Graph proved this domain needs dedicated tooling. Ponder is that tooling for TypeScript developers.

## Common Pitfalls

### Pitfall 1: Missing Factory Contract Pattern
**What goes wrong:** Indexer only tracks MarketFactory, not individual PredictionMarket events
**Why it happens:** Forgetting that MarketFactory creates new contracts with their own events
**How to avoid:** Use Ponder's factory() config to auto-discover markets from MarketCreated events
**Warning signs:** Buy/Sell events not appearing in database

### Pitfall 2: Weather Data in Indexed Tables
**What goes wrong:** Trying to store weather in ponder.schema.ts tables, causes stale data
**Why it happens:** Conflating "indexed blockchain data" with "external API data"
**How to avoid:** Keep weather in memory cache with TTL, serve via custom Hono endpoints
**Warning signs:** Weather data never updates, or complex "refresh" logic in indexing functions

### Pitfall 3: Not Setting startBlock
**What goes wrong:** Indexer scans from block 0, takes hours to sync
**Why it happens:** Default startBlock is 0; production contracts deployed much later
**How to avoid:** Set startBlock to deployment block in ponder.config.ts
**Warning signs:** Sync takes forever, empty results for long time

### Pitfall 4: Ignoring Reorgs
**What goes wrong:** Data inconsistency when chain reorgs occur
**Why it happens:** Custom indexers don't handle block reorganizations
**How to avoid:** Use Ponder - it handles reorgs automatically
**Warning signs:** Duplicate entries, incorrect balances (if hand-rolling)

### Pitfall 5: Blocking Weather API Calls in Event Handlers
**What goes wrong:** Indexing slows to crawl because weather APIs are slow
**Why it happens:** Calling weather API inside ponder.on() handlers
**How to avoid:** Weather data should be fetched on API request, not during indexing
**Warning signs:** Indexing throughput drops dramatically

### Pitfall 6: Volume Calculation Drift
**What goes wrong:** Volume counter doesn't match actual on-chain state
**Why it happens:** Not handling Sell events, or using non-atomic updates
**How to avoid:** Track both Buy and Sell; use Ponder's context.db.find() then update atomically
**Warning signs:** Volume only increases, never decreases on sells

## Code Examples

Verified patterns from official sources:

### Schema Definition
```typescript
// Source: https://ponder.sh/docs/api-reference/ponder/schema
// ponder.schema.ts
import { onchainTable, relations, index } from "ponder";

export const markets = onchainTable(
  "markets",
  (t) => ({
    id: t.hex().primaryKey(),           // Market contract address
    conditionId: t.hex().notNull(),
    questionId: t.hex().notNull(),
    cityId: t.text().notNull(),          // NYC, CHICAGO, MIAMI, AUSTIN
    resolutionTime: t.bigint().notNull(),
    createdAt: t.bigint().notNull(),
    volume: t.bigint().notNull(),        // Total USDC volume
    yesPool: t.bigint().notNull(),
    noPool: t.bigint().notNull(),
    resolved: t.boolean().notNull(),
  }),
  (table) => ({
    volumeIdx: index().on(table.volume),  // For hot markets sorting
    cityIdx: index().on(table.cityId),
  })
);

export const trades = onchainTable(
  "trades",
  (t) => ({
    id: t.text().primaryKey(),           // txHash-logIndex
    marketId: t.hex().notNull(),
    user: t.hex().notNull(),
    amount: t.bigint().notNull(),
    isYes: t.boolean().notNull(),
    isBuy: t.boolean().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    marketIdx: index().on(table.marketId),
    userIdx: index().on(table.user),
  })
);

export const positions = onchainTable(
  "positions",
  (t) => ({
    id: t.text().primaryKey(),           // marketId-user-isYes
    marketId: t.hex().notNull(),
    user: t.hex().notNull(),
    isYes: t.boolean().notNull(),
    shares: t.bigint().notNull(),
    costBasis: t.bigint().notNull(),
  }),
  (table) => ({
    userIdx: index().on(table.user),
  })
);

// Relations for GraphQL
export const marketsRelations = relations(markets, ({ many }) => ({
  trades: many(trades),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  market: one(markets, {
    fields: [trades.marketId],
    references: [markets.id],
  }),
}));
```

### Hot Markets Query (GraphQL)
```graphql
# Auto-generated by Ponder, available at /graphql
query HotMarkets {
  markets(
    orderBy: "volume"
    orderDirection: "desc"
    limit: 10
  ) {
    items {
      id
      conditionId
      cityId
      volume
      yesPool
      noPool
      resolutionTime
      trades(limit: 5, orderBy: "timestamp", orderDirection: "desc") {
        items {
          user
          amount
          isYes
          timestamp
        }
      }
    }
  }
}
```

### City ID Extraction from QuestionId
```typescript
// Helper to extract cityId from questionId bytes32
// Based on how oracle-service encodes questions
function extractCityId(questionId: `0x${string}`): string {
  // Assuming questionId encodes city in first 4 bytes
  // Adjust based on actual QuestionLib encoding
  const cityCode = parseInt(questionId.slice(2, 4), 16);
  const cities = ["NYC", "CHICAGO", "MIAMI", "AUSTIN"];
  return cities[cityCode] || "UNKNOWN";
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| The Graph (AssemblyScript) | Ponder (TypeScript) | 2023-2024 | Native TypeScript, 10x faster, easier debugging |
| Apollo Server | GraphQL Yoga | 2022-2023 | Better performance, SSE subscriptions, spec-compliant |
| WebSocket subscriptions | SSE subscriptions | 2023 | Simpler, HTTP/2 multiplexing, better firewall support |
| Custom database migrations | Declarative schemas | 2024 | Ponder/Drizzle handle migrations automatically |

**Deprecated/outdated:**
- subscription-transport-ws: Use graphql-ws or graphql-sse instead
- Apollo Server v3: v4 has issues, GraphQL Yoga recommended
- Manual reorg handling: Use Ponder's built-in support

## Open Questions

Things that couldn't be fully resolved:

1. **QuestionId encoding for city extraction**
   - What we know: QuestionLib creates questionId from city data
   - What's unclear: Exact encoding format to extract cityId in indexer
   - Recommendation: Inspect QuestionLib.sol or emit cityId in MarketCreated event

2. **Real-time price updates strategy**
   - What we know: Ponder supports GraphQL, SSE possible via Yoga
   - What's unclear: Whether to use SSE subscriptions or polling for price updates
   - Recommendation: Start with polling (simpler), add SSE if latency requirements demand it

3. **Position tracking across transfers**
   - What we know: SimpleConditionalTokens emits TransferSingle events
   - What's unclear: Whether to index all ERC1155 transfers or just Buy/Sell
   - Recommendation: Start with Buy/Sell only; add transfer indexing if secondary market needed

## Sources

### Primary (HIGH confidence)
- [Ponder documentation](https://ponder.sh/) - Indexing functions, schema, configuration
- [Ponder GitHub v0.16.2](https://github.com/ponder-sh/ponder) - Current version, project structure
- [Pothos GraphQL](https://pothos-graphql.dev/docs/guide) - Schema building patterns
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server/docs) - SSE subscriptions, server setup

### Secondary (MEDIUM confidence)
- [Polymarket subgraph architecture](https://docs.polymarket.com/developers/subgraph/overview) - Volume tracking, market entities
- [WebSearch: Prediction market backends 2026](https://insights.daffodilsw.com/blog/how-to-develop-a-platform-like-polymarket-1) - Architecture patterns

### Tertiary (LOW confidence)
- Hot markets ranking algorithm - Inferred from Polymarket patterns, no official spec
- Weather caching TTL (15 min) - Community best practice, adjust based on requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Ponder docs comprehensive, version verified
- Architecture: HIGH - Patterns from official Ponder docs and Polymarket
- Pitfalls: MEDIUM - Some from experience, some from community reports

**Research date:** 2026-01-28
**Valid until:** 2026-02-28 (Ponder evolving rapidly, check for updates)
