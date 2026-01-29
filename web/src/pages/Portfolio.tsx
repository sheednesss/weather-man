import { PositionList } from '@/features/portfolio/PositionList'

export function Portfolio() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Portfolio</h1>
      <PositionList />
    </div>
  )
}
