import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Types
interface Follower {
  address: string;
  displayName: string | null;
  followedAt: string;
}

interface FollowersResponse {
  address: string;
  followers: Follower[];
  count: number;
}

interface FollowingResponse {
  address: string;
  following: Follower[];
  count: number;
}

interface IsFollowingResponse {
  isFollowing: boolean;
}

/**
 * Fetch followers for an address
 */
export function useFollowers(address: string | undefined) {
  return useQuery({
    queryKey: ['followers', address],
    queryFn: async (): Promise<FollowersResponse> => {
      if (!address) throw new Error('No address provided');
      return api<FollowersResponse>(`/social/followers/${address.toLowerCase()}`);
    },
    enabled: Boolean(address),
    staleTime: 30_000,
  });
}

/**
 * Fetch users that an address follows
 */
export function useFollowing(address: string | undefined) {
  return useQuery({
    queryKey: ['following', address],
    queryFn: async (): Promise<FollowingResponse> => {
      if (!address) throw new Error('No address provided');
      return api<FollowingResponse>(`/social/following/${address.toLowerCase()}`);
    },
    enabled: Boolean(address),
    staleTime: 30_000,
  });
}

/**
 * Check if current user follows an address (requires auth)
 */
export function useIsFollowing(address: string | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['is-following', address],
    queryFn: async (): Promise<IsFollowingResponse> => {
      if (!address) throw new Error('No address provided');
      return api<IsFollowingResponse>(`/social/is-following/${address.toLowerCase()}`);
    },
    enabled: Boolean(address) && isAuthenticated,
    staleTime: 30_000,
  });
}

/**
 * Follow a user
 */
export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string): Promise<{ success: boolean; following: string }> => {
      return api(`/social/follow/${address.toLowerCase()}`, {
        method: 'POST',
      });
    },
    onSuccess: (_data, address) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['is-following', address.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['followers', address.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', address.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
  });
}

/**
 * Unfollow a user
 */
export function useUnfollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string): Promise<{ success: boolean; unfollowed: string }> => {
      return api(`/social/follow/${address.toLowerCase()}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_data, address) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['is-following', address.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['followers', address.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', address.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
  });
}
