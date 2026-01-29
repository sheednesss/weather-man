import { Link } from 'react-router-dom'
import { formatUnits } from 'viem'
import type { MarketWithWeather } from '@/types/market'
import { getCityDisplayName, formatTemperature } from '@/types/market'
import { USDC_DECIMALS } from '@/lib/contracts'

interface MarketCardProps {
  market: MarketWithWeather
}

export function MarketCard({ market }: MarketCardProps) {
  // Calculate YES/NO prices (0-100 cents)
  const totalPool = market.yesPool + market.noPool
  const yesPrice = totalPool > 0n
    ? Number(market.yesPool * 100n / totalPool)
    : 50
  const noPrice = 100 - yesPrice

  // Format temperature bounds
  const lowerTemp = formatTemperature(market.lowerBound)
  const upperTemp = formatTemperature(market.upperBound)

  // Format resolution time
  const resolutionDate = new Date(Number(market.resolutionTime) * 1000)
  const isResolved = market.resolved

  // Format volume
  const volumeFormatted = parseFloat(formatUnits(market.volume, USDC_DECIMALS)).toFixed(2)

  return (
    <Link to={`/markets/${market.id}`}>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
        {/* City and weather */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900">
            {getCityDisplayName(market.cityId)}
          </h3>
          {market.weather && (
            <span className="text-sm text-gray-500">
              {market.weather.current.temperature}F - {market.weather.current.conditions}
            </span>
          )}
        </div>

        {/* Temperature bracket question */}
        <p className="text-sm text-gray-600 mb-3">
          Will temperature be {lowerTemp}-{upperTemp}F?
        </p>

        {/* Price display */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-center">
            <span className="text-green-600 font-bold text-xl">{yesPrice}c</span>
            <p className="text-xs text-gray-500">YES</p>
          </div>
          <div className="text-center">
            <span className="text-red-600 font-bold text-xl">{noPrice}c</span>
            <p className="text-xs text-gray-500">NO</p>
          </div>
        </div>

        {/* Volume and status */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>Vol: ${volumeFormatted}</span>
          <span>
            {isResolved
              ? 'Resolved'
              : resolutionDate.toLocaleDateString()
            }
          </span>
        </div>
      </div>
    </Link>
  )
}
