import { ponder } from "ponder:registry";
import { markets, trades, positions } from "ponder:schema";

// Handler for Buy event
ponder.on("PredictionMarket:Buy", async ({ event, context }) => {
  const tradeId = `${event.transaction.hash}-${event.log.logIndex}`;
  const marketId = event.log.address;

  // Insert trade record
  await context.db.insert(trades).values({
    id: tradeId,
    marketId,
    user: event.args.user,
    amount: event.args.amount,
    isYes: event.args.isYes,
    isBuy: true,
    timestamp: event.block.timestamp,
  });

  // Update market volume
  const market = await context.db.find(markets, { id: marketId });
  if (market) {
    await context.db.update(markets, { id: marketId }).set({
      volume: market.volume + event.args.amount,
      yesPool: event.args.isYes ? market.yesPool + event.args.amount : market.yesPool,
      noPool: event.args.isYes ? market.noPool : market.noPool + event.args.amount,
    });
  }

  // Update or insert position
  const positionId = `${marketId}-${event.args.user}-${event.args.isYes}`;
  const existingPosition = await context.db.find(positions, { id: positionId });

  if (existingPosition) {
    await context.db.update(positions, { id: positionId }).set({
      shares: existingPosition.shares + event.args.amount,
      costBasis: existingPosition.costBasis + event.args.amount,
    });
  } else {
    await context.db.insert(positions).values({
      id: positionId,
      marketId,
      user: event.args.user,
      isYes: event.args.isYes,
      shares: event.args.amount,
      costBasis: event.args.amount,
    });
  }
});

// Handler for Sell event
ponder.on("PredictionMarket:Sell", async ({ event, context }) => {
  const tradeId = `${event.transaction.hash}-${event.log.logIndex}`;
  const marketId = event.log.address;

  // Insert trade record (isBuy = false for sell)
  await context.db.insert(trades).values({
    id: tradeId,
    marketId,
    user: event.args.user,
    amount: event.args.amount,
    isYes: event.args.isYes,
    isBuy: false,
    timestamp: event.block.timestamp,
  });

  // Update market volume (cumulative - we add for sells too, tracking total activity)
  const market = await context.db.find(markets, { id: marketId });
  if (market) {
    await context.db.update(markets, { id: marketId }).set({
      volume: market.volume + event.args.amount,
      // Reduce pools on sell
      yesPool: event.args.isYes
        ? (market.yesPool > event.args.amount ? market.yesPool - event.args.amount : 0n)
        : market.yesPool,
      noPool: event.args.isYes
        ? market.noPool
        : (market.noPool > event.args.amount ? market.noPool - event.args.amount : 0n),
    });
  }

  // Update position
  const positionId = `${marketId}-${event.args.user}-${event.args.isYes}`;
  const existingPosition = await context.db.find(positions, { id: positionId });

  if (existingPosition) {
    const newShares = existingPosition.shares > event.args.amount
      ? existingPosition.shares - event.args.amount
      : 0n;

    // Reduce cost basis proportionally
    const reduction = existingPosition.costBasis > event.args.amount
      ? event.args.amount
      : existingPosition.costBasis;

    await context.db.update(positions, { id: positionId }).set({
      shares: newShares,
      costBasis: existingPosition.costBasis - reduction,
    });
  }
});
