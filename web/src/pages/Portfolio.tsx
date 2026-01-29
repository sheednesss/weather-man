import { useAccount } from 'wagmi'

export function Portfolio() {
  const { isConnected } = useAccount()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Portfolio</h1>
      {isConnected ? (
        <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
          <p>Your positions will be displayed here.</p>
          <p className="text-sm mt-2">Coming soon: Track your predictions and earnings.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
          <p>Connect your wallet to view your portfolio.</p>
        </div>
      )}
    </div>
  )
}
