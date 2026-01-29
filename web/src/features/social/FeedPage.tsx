import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/usePredictions';
import { ProfileCard } from './ProfileCard';

/**
 * Feed page showing predictions from followed users
 */
export function FeedPage() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error } = useFeed();

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Sign in to see your feed</h2>
        <p className="text-gray-500">Follow forecasters to see their predictions here</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-100 h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">
        Failed to load feed
      </div>
    );
  }

  if (!data?.predictions || data.predictions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your feed is empty</h2>
        <p className="text-gray-500 mb-4">Follow some forecasters to see their predictions</p>
        <Link
          to="/markets"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Browse Markets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.predictions.map((prediction) => (
        <div key={prediction.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <ProfileCard
              address={prediction.authorAddress}
              displayName={prediction.authorDisplayName}
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatRelativeTime(prediction.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                prediction.isYes
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {prediction.isYes ? 'YES' : 'NO'}
            </span>
            <Link
              to={`/markets/${prediction.marketId}`}
              className="text-sm text-blue-600 hover:underline"
            >
              View Market
            </Link>
          </div>

          <p className="text-gray-700 text-sm whitespace-pre-wrap">{prediction.explanation}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default FeedPage;
