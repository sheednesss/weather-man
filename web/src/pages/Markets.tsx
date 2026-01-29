import { MarketList } from '@/features/markets/MarketList'

export function Markets() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Markets</h1>
      <p className="text-gray-600 mb-6">
        Browse prediction markets sorted by volume. Click a market to trade.
      </p>
      <MarketList />
    </div>
  )
}
