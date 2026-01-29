// Position types matching Ponder schema (indexer-api/ponder.schema.ts)

export interface Position {
  id: string;                  // marketId-user-isYes
  marketId: `0x${string}`;
  user: `0x${string}`;
  isYes: boolean;
  shares: bigint;
  costBasis: bigint;           // Total USDC spent to acquire position
}

// Helper to calculate average cost per share
export function calculateAverageCost(costBasis: bigint, shares: bigint): bigint {
  if (shares === 0n) return 0n;
  return costBasis / shares;
}

// Helper to calculate unrealized P&L
export function calculateUnrealizedPnL(
  shares: bigint,
  costBasis: bigint,
  currentPrice: bigint
): bigint {
  const currentValue = shares * currentPrice;
  return currentValue - costBasis;
}
