import { useParams } from 'react-router-dom'
import { useMarket } from '@/hooks/useMarkets'
import { useWeather } from '@/hooks/useMarketsWithWeather'
import { MarketDetail } from '@/features/markets/MarketDetail'

export function Market() {
  const { id } = useParams<{ id: string }>()
  const marketId = id as `0x${string}` | undefined

  const { data: market, isLoading: marketLoading, error: marketError } = useMarket(marketId)
  const { data: weather } = useWeather(market?.cityId)

  if (!marketId) {
    return (
      <div className="py-6">
        <div className="text-center text-red-600">Invalid market ID</div>
      </div>
    )
  }

  if (marketLoading) {
    return (
      <div className="py-6">
        <div className="text-center text-gray-600">Loading market...</div>
      </div>
    )
  }

  if (marketError || !market) {
    return (
      <div className="py-6">
        <div className="text-center text-red-600">
          Market not found. It may not exist or the indexer may be down.
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <MarketDetail market={market} weather={weather ?? null} />
    </div>
  )
}
