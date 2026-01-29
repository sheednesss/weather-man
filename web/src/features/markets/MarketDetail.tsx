import { Link } from 'react-router-dom'
import { formatUnits } from 'viem'
import type { Market } from '@/types/market'
import type { WeatherData } from '@/types/market'
import { getCityDisplayName, formatTemperature } from '@/types/market'
import { USDC_DECIMALS } from '@/lib/contracts'
import { TradeForm } from '@/features/trading/TradeForm'
import { CommentList } from '@/features/social/CommentList'
import { CommentForm } from '@/features/social/CommentForm'

interface MarketDetailProps {
  market: Market
  weather: WeatherData | null
}

export function MarketDetail({ market, weather }: MarketDetailProps) {
  // Calculate YES/NO prices
  const totalPool = market.yesPool + market.noPool
  const yesPrice = totalPool > 0n
    ? Number(market.yesPool * 100n / totalPool)
    : 50
  const noPrice = 100 - yesPrice

  // Format values
  const lowerTemp = formatTemperature(market.lowerBound)
  const upperTemp = formatTemperature(market.upperBound)
  const resolutionDate = new Date(Number(market.resolutionTime) * 1000)
  const volumeFormatted = parseFloat(formatUnits(market.volume, USDC_DECIMALS)).toFixed(2)
  const yesPoolFormatted = parseFloat(formatUnits(market.yesPool, USDC_DECIMALS)).toFixed(2)
  const noPoolFormatted = parseFloat(formatUnits(market.noPool, USDC_DECIMALS)).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/markets" className="text-blue-600 hover:underline text-sm">
        &larr; Back to Markets
      </Link>

      {/* Market header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getCityDisplayName(market.cityId)}
            </h1>
            <p className="text-gray-600 mt-1">
              Will temperature be {lowerTemp}-{upperTemp}F?
            </p>
          </div>
          {market.resolved && (
            <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
              Resolved
            </span>
          )}
        </div>

        {/* Weather info */}
        {weather && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">Current Weather</h3>
            <div className="flex justify-between text-sm text-blue-800">
              <span>Temperature: {weather.current.temperature}F</span>
              <span>{weather.current.conditions}</span>
            </div>
            <div className="text-sm text-blue-700 mt-1">
              Forecast: High {weather.forecast.high}F / Low {weather.forecast.low}F
            </div>
          </div>
        )}

        {/* Price display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <span className="text-3xl font-bold text-green-600">{yesPrice}c</span>
            <p className="text-sm text-green-700 mt-1">YES</p>
            <p className="text-xs text-green-600 mt-1">Pool: ${yesPoolFormatted}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <span className="text-3xl font-bold text-red-600">{noPrice}c</span>
            <p className="text-sm text-red-700 mt-1">NO</p>
            <p className="text-xs text-red-600 mt-1">Pool: ${noPoolFormatted}</p>
          </div>
        </div>

        {/* Market stats */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="text-gray-500">Volume:</span> ${volumeFormatted}
          </div>
          <div>
            <span className="text-gray-500">Resolution:</span> {resolutionDate.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Trade form */}
      {!market.resolved && (
        <div className="lg:max-w-md">
          <TradeForm
            marketAddress={market.id}
            yesPrice={yesPrice}
            noPrice={noPrice}
            marketQuestion={`${getCityDisplayName(market.cityId)}: ${lowerTemp}-${upperTemp}F`}
          />
        </div>
      )}

      {market.resolved && (
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600">
          This market has been resolved. Trading is closed.
        </div>
      )}

      {/* Comments section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Discussion</h2>
        <div className="space-y-6">
          <CommentForm marketId={market.id} />
          <CommentList marketId={market.id} />
        </div>
      </div>
    </div>
  )
}
