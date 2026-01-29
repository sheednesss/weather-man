import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useBuy } from '@/hooks/useTrade'

interface TradeFormProps {
  marketAddress: `0x${string}`
  yesPrice: number
  noPrice: number
}

export function TradeForm({ marketAddress, yesPrice, noPrice }: TradeFormProps) {
  const { isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [side, setSide] = useState<'yes' | 'no'>('yes')

  const { buy, isPending, isConfirming, isSuccess, error, reset } = useBuy(marketAddress)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    buy(side === 'yes', amount)
  }

  const handleReset = () => {
    reset()
    setAmount('')
  }

  if (!isConnected) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <p className="text-center text-gray-600 mb-4">Connect wallet to trade</p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
        <p className="text-center text-green-700 font-medium mb-4">Trade successful!</p>
        <button
          onClick={handleReset}
          className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
        >
          Make Another Trade
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-4 text-gray-900">Place Trade</h3>

      {/* Side selector */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSide('yes')}
          className={`flex-1 py-3 rounded font-medium transition-colors ${
            side === 'yes'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          YES @ {yesPrice}c
        </button>
        <button
          type="button"
          onClick={() => setSide('no')}
          className={`flex-1 py-3 rounded font-medium transition-colors ${
            side === 'no'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          NO @ {noPrice}c
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">Amount (USDC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10.00"
          step="0.01"
          min="0"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>

      {/* Estimated shares */}
      {amount && parseFloat(amount) > 0 && (
        <p className="text-sm text-gray-600 mb-4">
          Est. shares: {(parseFloat(amount) / (side === 'yes' ? yesPrice : noPrice) * 100).toFixed(2)}
        </p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending || isConfirming || !amount}
        className={`w-full py-3 rounded font-medium text-white transition-colors ${
          isPending || isConfirming
            ? 'bg-gray-400 cursor-not-allowed'
            : side === 'yes'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {isPending
          ? 'Confirm in wallet...'
          : isConfirming
            ? 'Confirming...'
            : `Buy ${side.toUpperCase()}`}
      </button>

      {/* Error display */}
      {error && (
        <p className="text-red-600 text-sm mt-2">
          {error.message.includes('User rejected')
            ? 'Transaction cancelled'
            : 'Transaction failed. Try again.'}
        </p>
      )}
    </form>
  )
}
