import { Link } from 'react-router-dom';
import { FollowButton } from './FollowButton';

interface ProfileCardProps {
  address: string;
  displayName?: string | null;
  showFollowButton?: boolean;
}

/**
 * Compact user profile card showing address and optional display name
 * Links to full profile page
 */
export function ProfileCard({ address, displayName, showFollowButton }: ProfileCardProps) {
  // Truncate address for display (0x1234...5678)
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-3">
      <Link
        to={`/profile/${address}`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {(displayName?.[0] || address[2]).toUpperCase()}
        </div>
        <div className="min-w-0">
          {displayName && (
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          )}
          <p className="text-xs text-gray-500 font-mono">{truncatedAddress}</p>
        </div>
      </Link>
      {showFollowButton && <FollowButton address={address} />}
    </div>
  );
}

export default ProfileCard;
