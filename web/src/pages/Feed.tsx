import { FeedPage } from '@/features/social/FeedPage';

/**
 * Feed page wrapper
 * Shows predictions from followed users
 */
export function Feed() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Feed</h1>
      <FeedPage />
    </div>
  );
}

export default Feed;
