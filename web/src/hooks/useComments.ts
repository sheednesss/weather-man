import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Types
interface Comment {
  id: number;
  authorAddress: string;
  authorDisplayName: string | null;
  content: string;
  createdAt: string;
}

interface CommentsResponse {
  marketId: string;
  comments: Comment[];
  count: number;
}

interface AddCommentResponse {
  id: number;
  marketId: string;
  authorAddress: string;
  content: string;
  createdAt: string;
}

/**
 * Fetch comments for a market
 */
export function useComments(marketId: string | undefined) {
  return useQuery({
    queryKey: ['comments', marketId],
    queryFn: async (): Promise<CommentsResponse> => {
      if (!marketId) throw new Error('No marketId provided');
      return api<CommentsResponse>(`/social/markets/${marketId.toLowerCase()}/comments`);
    },
    enabled: Boolean(marketId),
    staleTime: 30_000,
  });
}

/**
 * Add a comment to a market
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      marketId,
      content,
    }: {
      marketId: string;
      content: string;
    }): Promise<AddCommentResponse> => {
      return api<AddCommentResponse>(`/social/markets/${marketId.toLowerCase()}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: (_data, variables) => {
      // Invalidate comments query for this market
      queryClient.invalidateQueries({ queryKey: ['comments', variables.marketId.toLowerCase()] });
    },
  });
}
