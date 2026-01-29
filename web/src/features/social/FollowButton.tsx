import { useAuth } from '@/hooks/useAuth';
import { useIsFollowing, useFollow, useUnfollow } from '@/hooks/useFollow';

interface FollowButtonProps {
  address: string;
}

/**
 * Follow/Unfollow button for user profiles
 * Disabled if not authenticated or viewing own profile
 */
export function FollowButton({ address }: FollowButtonProps) {
  const { isAuthenticated, address: myAddress } = useAuth();
  const { data: followData, isLoading: isCheckingFollow } = useIsFollowing(address);
  const { mutate: follow, isPending: isFollowing } = useFollow();
  const { mutate: unfollow, isPending: isUnfollowing } = useUnfollow();

  const isOwnProfile = myAddress?.toLowerCase() === address.toLowerCase();
  const isFollowed = followData?.isFollowing ?? false;
  const isLoading = isCheckingFollow || isFollowing || isUnfollowing;

  // Don't show button for own profile
  if (isOwnProfile) {
    return null;
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <button
        disabled
        className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-400 rounded-full cursor-not-allowed"
        title="Sign in to follow"
      >
        Follow
      </button>
    );
  }

  const handleClick = () => {
    if (isFollowed) {
      unfollow(address);
    } else {
      follow(address);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
        isFollowed
          ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? '...' : isFollowed ? 'Following' : 'Follow'}
    </button>
  );
}

export default FollowButton;
