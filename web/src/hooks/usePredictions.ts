import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Types
interface Prediction {
  id: number;
  marketId: string;
  authorAddress: string;
  authorDisplayName: string | null;
  explanation: string;
  isYes: boolean;
  createdAt: string;
}

interface PredictionsResponse {
  marketId: string;
  predictions: Prediction[];
  count: number;
}

interface FeedResponse {
  predictions: Prediction[];
  count: number;
}

interface AddPredictionResponse {
  id: number;
  marketId: string;
  authorAddress: string;
  explanation: string;
  isYes: boolean;
  createdAt: string;
}

/**
 * Fetch predictions for a market
 */
export function usePredictions(marketId: string | undefined) {
  return useQuery({
    queryKey: ['predictions', marketId],
    queryFn: async (): Promise<PredictionsResponse> => {
      if (!marketId) throw new Error('No marketId provided');
      return api<PredictionsResponse>(`/social/markets/${marketId.toLowerCase()}/predictions`);
    },
    enabled: Boolean(marketId),
    staleTime: 30_000,
  });
}

/**
 * Add a prediction with explanation
 */
export function useAddPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      marketId,
      explanation,
      isYes,
    }: {
      marketId: string;
      explanation: string;
      isYes: boolean;
    }): Promise<AddPredictionResponse> => {
      return api<AddPredictionResponse>(`/social/markets/${marketId.toLowerCase()}/predictions`, {
        method: 'POST',
        body: JSON.stringify({ explanation, isYes }),
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate predictions query for this market and feed
      queryClient.invalidateQueries({ queryKey: ['predictions', variables.marketId.toLowerCase()] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-predictions'] });
    },
  });
}

/**
 * Fetch feed of predictions from followed users (requires auth)
 */
export function useFeed() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['feed'],
    queryFn: async (): Promise<FeedResponse> => {
      return api<FeedResponse>('/social/feed');
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}
