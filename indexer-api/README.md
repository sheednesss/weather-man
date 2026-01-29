# Weather Man Indexer API

Ponder-based indexer for Weather Man prediction markets on Base Sepolia. Provides both a GraphQL API for blockchain data and REST endpoints for weather data.

## Overview

This indexer tracks prediction market events from the MarketFactory and PredictionMarket contracts:

- **MarketCreated** - New temperature prediction markets
- **Buy** - Users buying YES/NO positions
- **Sell** - Users selling positions

Data is indexed into markets, trades, and positions tables with automatic GraphQL API generation.

## Setup

### Prerequisites

- Node.js >= 18.14 (Ponder requirement)
- Base Sepolia RPC URL (Alchemy, Infura, or other provider)
- Deployed MarketFactory contract address

### Installation

```bash
cd indexer-api
npm install
```

### Configuration

1. Copy the environment example file:

```bash
cp .env.example .env.local
```

2. Configure your `.env.local`:

```bash
# Base Sepolia RPC URL
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Deployed MarketFactory contract address
MARKET_FACTORY_ADDRESS=0x...

# Block number to start indexing from (use deployment block for efficiency)
START_BLOCK=12345678

# Database (optional - uses PGlite in development)
DATABASE_URL=
```

### Running the Indexer

```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:42069`.

## GraphQL API

Access the GraphQL playground at `http://localhost:42069` (or `/graphql`).

### Hot Markets Query

Get markets sorted by trading volume (descending):

```graphql
query HotMarkets {
  markets(orderBy: "volume", orderDirection: "desc", limit: 10) {
    items {
      id
      cityId
      lowerBound
      upperBound
      resolutionTime
      volume
      yesPool
      noPool
      resolved
    }
  }
}
```

### Markets by City

Get all markets for a specific city:

```graphql
query MarketsByCity($cityId: String!) {
  markets(where: { cityId: $cityId }, orderBy: "resolutionTime", orderDirection: "desc") {
    items {
      id
      cityId
      lowerBound
      upperBound
      resolutionTime
      volume
      resolved
    }
  }
}
```

Variables:
```json
{
  "cityId": "NYC"
}
```

### User Positions

Get all positions for a user address:

```graphql
query UserPositions($user: String!) {
  positions(where: { user: $user }) {
    items {
      id
      marketId
      user
      isYes
      shares
      costBasis
      market {
        cityId
        lowerBound
        upperBound
        resolutionTime
        resolved
      }
    }
  }
}
```

Variables:
```json
{
  "user": "0x..."
}
```

### Recent Trades

Get recent trades across all markets:

```graphql
query RecentTrades {
  trades(orderBy: "timestamp", orderDirection: "desc", limit: 20) {
    items {
      id
      marketId
      user
      amount
      isYes
      isBuy
      timestamp
      market {
        cityId
        lowerBound
        upperBound
      }
    }
  }
}
```

### Market Details with Trades

Get a specific market with its trade history:

```graphql
query MarketDetails($marketId: String!) {
  market(id: $marketId) {
    id
    conditionId
    questionId
    cityId
    lowerBound
    upperBound
    resolutionTime
    createdAt
    volume
    yesPool
    noPool
    resolved
    trades {
      items {
        id
        user
        amount
        isYes
        isBuy
        timestamp
      }
    }
  }
}
```

## REST API Endpoints

### Weather Endpoints

Weather data is fetched from Open-Meteo API with 15-minute caching.

#### Get Weather for City

```bash
curl http://localhost:42069/weather/NYC
```

Response:
```json
{
  "temperature": 72.5,
  "conditions": "Partly Cloudy",
  "forecast": [
    { "date": "2026-01-29", "high": 75, "low": 62, "conditions": "Clear" },
    { "date": "2026-01-30", "high": 68, "low": 55, "conditions": "Rain" },
    ...
  ]
}
```

Supported cities: `NYC`, `CHICAGO`, `MIAMI`, `AUSTIN`

#### Get Weather for All Cities

```bash
curl http://localhost:42069/weather
```

Response:
```json
{
  "NYC": { "temperature": 72.5, "conditions": "Partly Cloudy", "forecast": [...] },
  "CHICAGO": { "temperature": 65.0, "conditions": "Clear", "forecast": [...] },
  "MIAMI": { "temperature": 82.0, "conditions": "Rain", "forecast": [...] },
  "AUSTIN": { "temperature": 78.5, "conditions": "Clear", "forecast": [...] }
}
```

### Combined Market + Weather Endpoint

```bash
curl http://localhost:42069/markets-with-weather
```

Returns top 50 markets by volume with embedded weather data:

```json
[
  {
    "id": "0x...",
    "cityId": "NYC",
    "lowerBound": 6000,
    "upperBound": 7500,
    "resolutionTime": "1738200000",
    "volume": "1000000000",
    "yesPool": "500000000",
    "noPool": "500000000",
    "resolved": false,
    "weather": {
      "temperature": 72.5,
      "conditions": "Partly Cloudy",
      "forecast": [...]
    }
  },
  ...
]
```

## Data Schema

### Markets Table

| Field | Type | Description |
|-------|------|-------------|
| id | hex | Market contract address (primary key) |
| conditionId | hex | CTF condition ID |
| questionId | hex | Encoded market parameters |
| cityId | string | City code (NYC, CHICAGO, MIAMI, AUSTIN) |
| lowerBound | int | Temperature lower bound (scaled by 100) |
| upperBound | int | Temperature upper bound (scaled by 100) |
| resolutionTime | bigint | Unix timestamp for resolution |
| createdAt | bigint | Block timestamp of creation |
| volume | bigint | Total USDC trading volume |
| yesPool | bigint | USDC in YES pool |
| noPool | bigint | USDC in NO pool |
| resolved | bool | Whether market is resolved |

### Trades Table

| Field | Type | Description |
|-------|------|-------------|
| id | string | Transaction hash + log index |
| marketId | hex | Market contract address |
| user | hex | User address |
| amount | bigint | USDC amount |
| isYes | bool | YES or NO position |
| isBuy | bool | Buy or sell |
| timestamp | bigint | Block timestamp |

### Positions Table

| Field | Type | Description |
|-------|------|-------------|
| id | string | marketId-user-isYes |
| marketId | hex | Market contract address |
| user | hex | User address |
| isYes | bool | YES or NO position |
| shares | bigint | Number of shares held |
| costBasis | bigint | Total USDC spent |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| BASE_RPC_URL | Yes | Base Sepolia RPC endpoint |
| MARKET_FACTORY_ADDRESS | Yes | Deployed MarketFactory address |
| START_BLOCK | No | Block to start indexing (default: 0) |
| DATABASE_URL | No | Postgres URL (uses PGlite if empty) |

## Temperature Values

Temperature bounds are stored as integers scaled by 100:

- `6000` = 60.00 degrees Fahrenheit
- `7500` = 75.00 degrees Fahrenheit

This allows precise decimal temperatures without floating point.

## Development

```bash
# Type checking
npm run typecheck

# Build for production
npm run serve
```

## Architecture

```
indexer-api/
  abis/               # Contract ABIs (MarketFactory, PredictionMarket)
  src/
    MarketFactory.ts  # MarketCreated event handler
    PredictionMarket.ts # Buy/Sell event handlers
    lib/
      cities.ts       # City coordinates
      weather.ts      # Weather fetching with cache
    api/
      index.ts        # Custom Hono routes (weather endpoints)
  ponder.config.ts    # Chain and contract configuration
  ponder.schema.ts    # Database schema definitions
```
