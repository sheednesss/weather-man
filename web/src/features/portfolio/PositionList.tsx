import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatUnits } from 'viem'
import { PositionCard } from './PositionCard'
import { usePositions } from '@/hooks/usePositions'
import { useMarkets } from '@/hooks/useMarkets'
import { USDC_DECIMALS } from '@/lib/contracts'

export function PositionList() {
  const { isConnected } = useAccount()
  const { data: positions, isLoading: positionsLoading } = usePositions()
  const { data: markets } = useMarkets()

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Connect your wallet to view positions</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    )
  }

  if (positionsLoading) {
    return (
      <div className="text-center py-8 text-gray-600">
        Loading positions...
      </div>
    )
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="mb-2">No positions yet</p>
        <p className="text-sm">Trade on markets to build your portfolio</p>
      </div>
    )
  }

  // Create market lookup for P&L calculations
  const marketMap = new Map(markets?.map(m => [m.id.toLowerCase(), m]) || [])

  // Calculate totals
  const totalCostBasis = positions.reduce(
    (sum, p) => sum + parseFloat(formatUnits(p.costBasis, USDC_DECIMALS)),
    0
  )

  // Calculate total current value and P&L
  let totalCurrentValue = 0
  positions.forEach(position => {
    const market = marketMap.get(position.marketId.toLowerCase())
    if (market) {
      const shares = parseFloat(formatUnits(position.shares, USDC_DECIMALS))
      const totalPool = market.yesPool + market.noPool
      const price = totalPool > 0n
        ? Number(position.isYes
            ? market.yesPool * 100n / totalPool
            : market.noPool * 100n / totalPool
          ) / 100
        : 0.5
      totalCurrentValue += shares * price
    }
  })

  const totalPnl = totalCurrentValue - totalCostBasis
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0
  const pnlColor = totalPnl >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div>
      {/* Portfolio summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Invested</p>
            <p className="text-xl font-bold text-gray-900">${totalCostBasis.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Value</p>
            <p className="text-xl font-bold text-gray-900">${totalCurrentValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total P&L</p>
            <p className={`text-xl font-bold ${pnlColor}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} ({totalPnlPercent.toFixed(1)}%)
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Positions</p>
            <p className="text-xl font-bold text-gray-900">{positions.length}</p>
          </div>
        </div>
      </div>

      {/* Position cards */}
      <div className="space-y-3">
        {positions.map((position) => (
          <PositionCard
            key={position.id}
            position={position}
            market={marketMap.get(position.marketId.toLowerCase())}
          />
        ))}
      </div>
    </div>
  )
}
