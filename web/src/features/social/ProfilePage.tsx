import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useProfileStats, useUpdateProfile, useUserPredictions } from '@/hooks/useProfile';
import { FollowButton } from './FollowButton';

/**
 * User profile page with predictions list
 * Editable if viewing own profile
 */
export function ProfilePage() {
  const { address } = useParams<{ address: string }>();
  const { address: myAddress, isAuthenticated } = useAuth();

  const isOwnProfile = isAuthenticated && myAddress?.toLowerCase() === address?.toLowerCase();

  const { data: profile, isLoading: profileLoading } = useProfile(address);
  const { data: stats, isLoading: statsLoading } = useProfileStats(address);
  const { data: predictionsData, isLoading: predictionsLoading } = useUserPredictions(address);
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Initialize edit form with current values
  const startEditing = () => {
    setDisplayName(profile?.displayName || '');
    setBio(profile?.bio || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile(
      {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDisplayName(profile?.displayName || '');
    setBio(profile?.bio || '');
  };

  if (!address) {
    return <div className="text-center text-gray-500">Invalid address</div>;
  }

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const isLoading = profileLoading || statsLoading;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {(profile?.displayName?.[0] || address[2]).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Display name"
                      maxLength={50}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Bio"
                      maxLength={500}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="text-xl font-bold text-gray-900">
                        {profile?.displayName || truncatedAddress}
                      </h1>
                      {!isOwnProfile && <FollowButton address={address} />}
                    </div>
                    <p className="text-sm text-gray-500 font-mono">{truncatedAddress}</p>
                    {profile?.bio && (
                      <p className="mt-2 text-gray-700">{profile.bio}</p>
                    )}
                    {isOwnProfile && (
                      <button
                        onClick={startEditing}
                        className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                      >
                        Edit Profile
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
              <div>
                <span className="text-xl font-bold text-gray-900">{stats?.followerCount ?? 0}</span>
                <span className="text-sm text-gray-500 ml-1">followers</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">{stats?.followingCount ?? 0}</span>
                <span className="text-sm text-gray-500 ml-1">following</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">{predictionsData?.count ?? 0}</span>
                <span className="text-sm text-gray-500 ml-1">predictions</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Predictions list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Predictions</h2>
        {predictionsLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 h-24 rounded-lg" />
            ))}
          </div>
        ) : predictionsData?.predictions && predictionsData.predictions.length > 0 ? (
          <div className="space-y-4">
            {predictionsData.predictions.map((prediction) => (
              <div key={prediction.id} className="bg-white border border-gray-200 rounded-lg p-4">
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
                    className="text-sm text-blue-600 hover:underline font-mono"
                  >
                    {prediction.marketId.slice(0, 10)}...
                  </Link>
                  <span className="text-xs text-gray-400 ml-auto">
                    {formatRelativeTime(prediction.createdAt)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{prediction.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg text-center">
            No predictions yet
          </div>
        )}
      </div>
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

export default ProfilePage;
