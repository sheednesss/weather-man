import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
        Stake on Weather Predictions
      </h1>
      <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl">
        Predict tomorrow's temperature in major cities. Earn rewards for accurate forecasts
        and build your reputation as a weather expert.
      </p>
      <Link
        to="/markets"
        className="px-8 py-3 text-lg font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        Browse Markets
      </Link>
    </div>
  )
}
