import { onchainTable, index, relations } from "ponder";

// Markets table - stores all prediction markets
export const markets = onchainTable(
  "markets",
  (t) => ({
    id: t.hex().primaryKey(),              // Market contract address
    conditionId: t.hex().notNull(),
    questionId: t.hex().notNull(),
    cityId: t.text().notNull(),            // NYC, CHICAGO, MIAMI, AUSTIN
    lowerBound: t.integer().notNull(),     // Temperature lower bound (scaled by 100)
    upperBound: t.integer().notNull(),     // Temperature upper bound (scaled by 100)
    resolutionTime: t.bigint().notNull(),
    createdAt: t.bigint().notNull(),
    volume: t.bigint().notNull(),          // Total USDC volume
    yesPool: t.bigint().notNull(),
    noPool: t.bigint().notNull(),
    resolved: t.boolean().notNull(),
  }),
  (table) => ({
    volumeIdx: index().on(table.volume),   // For hot markets sorting
    cityIdx: index().on(table.cityId),
  })
);

// Trades table - stores all buy/sell transactions
export const trades = onchainTable(
  "trades",
  (t) => ({
    id: t.text().primaryKey(),             // txHash-logIndex
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

// Positions table - tracks user positions per market
export const positions = onchainTable(
  "positions",
  (t) => ({
    id: t.text().primaryKey(),             // marketId-user-isYes
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

export const positionsRelations = relations(positions, ({ one }) => ({
  market: one(markets, {
    fields: [positions.marketId],
    references: [markets.id],
  }),
}));
