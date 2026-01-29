import { MarketCard } from './MarketCard'
import { useMarketsWithWeather } from '@/hooks/useMarketsWithWeather'

export function MarketList() {
  const { data: markets, isLoading, error } = useMarketsWithWeather()

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-600">
        Loading markets...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load markets. Is the indexer running?
      </div>
    )
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="mb-2">No markets yet</p>
        <p className="text-sm">Markets will appear here once deployed.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  )
}
