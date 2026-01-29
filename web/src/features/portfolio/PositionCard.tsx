import { Link } from 'react-router-dom'
import { formatUnits } from 'viem'
import type { Position } from '@/types/position'
import type { Market } from '@/types/market'
import { getCityDisplayName } from '@/types/market'
import { USDC_DECIMALS } from '@/lib/contracts'

interface PositionCardProps {
  position: Position
  market?: Market
}

export function PositionCard({ position, market }: PositionCardProps) {
  const shares = parseFloat(formatUnits(position.shares, USDC_DECIMALS))
  const costBasis = parseFloat(formatUnits(position.costBasis, USDC_DECIMALS))

  // Calculate current value and P&L if market data available
  let currentValue = 0
  let pnl = 0
  let pnlPercent = 0

  if (market) {
    const totalPool = market.yesPool + market.noPool
    const price = totalPool > 0n
      ? Number(position.isYes
          ? market.yesPool * 100n / totalPool
          : market.noPool * 100n / totalPool
        ) / 100
      : 0.5

    currentValue = shares * price
    pnl = currentValue - costBasis
    pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0
  }

  const pnlColor = pnl >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <Link to={`/markets/${position.marketId}`}>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
              position.isYes
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {position.isYes ? 'YES' : 'NO'}
            </span>
            {market && (
              <span className="text-gray-700 font-medium">
                {getCityDisplayName(market.cityId)}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">
            {shares.toFixed(2)} shares
          </span>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-gray-500">Cost Basis</p>
            <p className="font-medium text-gray-900">${costBasis.toFixed(2)}</p>
          </div>
          {market && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Current Value</p>
              <p className="font-medium text-gray-900">${currentValue.toFixed(2)}</p>
            </div>
          )}
          {market && (
            <div className="text-right">
              <p className="text-xs text-gray-500">P&L</p>
              <p className={`font-medium ${pnlColor}`}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
