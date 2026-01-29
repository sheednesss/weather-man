import { useComments } from '@/hooks/useComments';
import { ProfileCard } from './ProfileCard';

interface CommentListProps {
  marketId: string;
}

/**
 * Display list of comments for a market
 */
export function CommentList({ marketId }: CommentListProps) {
  const { data, isLoading, error } = useComments(marketId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">
        Failed to load comments
      </div>
    );
  }

  if (!data?.comments || data.comments.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg text-center">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.comments.map((comment) => (
        <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <ProfileCard
              address={comment.authorAddress}
              displayName={comment.authorDisplayName}
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-2 text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Format timestamp as relative time (e.g., "2h ago")
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

export default CommentList;
