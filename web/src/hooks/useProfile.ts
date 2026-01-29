import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
interface Profile {
  address: string;
  displayName: string | null;
  bio: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ProfileStats {
  address: string;
  followerCount: number;
  followingCount: number;
}

interface Prediction {
  id: number;
  marketId: string;
  authorAddress: string;
  explanation: string;
  isYes: boolean;
  createdAt: string;
}

interface UserPredictionsResponse {
  address: string;
  predictions: Prediction[];
  count: number;
}

/**
 * Fetch user profile by address
 */
export function useProfile(address: string | undefined) {
  return useQuery({
    queryKey: ['profile', address],
    queryFn: async (): Promise<Profile> => {
      if (!address) throw new Error('No address provided');
      return api<Profile>(`/social/profiles/${address.toLowerCase()}`);
    },
    enabled: Boolean(address),
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Fetch profile stats (follower/following counts)
 */
export function useProfileStats(address: string | undefined) {
  return useQuery({
    queryKey: ['profile-stats', address],
    queryFn: async (): Promise<ProfileStats> => {
      if (!address) throw new Error('No address provided');
      return api<ProfileStats>(`/social/profiles/${address.toLowerCase()}/stats`);
    },
    enabled: Boolean(address),
    staleTime: 30_000,
  });
}

/**
 * Update own profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { displayName?: string; bio?: string }): Promise<Profile> => {
      return api<Profile>('/social/profiles', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Invalidate profile query for this address
      queryClient.invalidateQueries({ queryKey: ['profile', data.address] });
    },
  });
}

/**
 * Fetch user's predictions
 */
export function useUserPredictions(address: string | undefined) {
  return useQuery({
    queryKey: ['user-predictions', address],
    queryFn: async (): Promise<UserPredictionsResponse> => {
      if (!address) throw new Error('No address provided');
      return api<UserPredictionsResponse>(`/social/profiles/${address.toLowerCase()}/predictions`);
    },
    enabled: Boolean(address),
    staleTime: 30_000,
  });
}
