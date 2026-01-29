import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAccount } from 'wagmi';
import { graphqlClient } from '@/lib/graphql';
import type { Position } from '@/types/position';

const POSITIONS_QUERY = gql`
  query GetPositions($user: String!) {
    positionss(where: { user: $user }) {
      items {
        id
        marketId
        user
        isYes
        shares
        costBasis
      }
    }
  }
`;

// Raw response from GraphQL (strings for bigint fields)
interface RawPosition {
  id: string;
  marketId: `0x${string}`;
  user: `0x${string}`;
  isYes: boolean;
  shares: string;
  costBasis: string;
}

interface PositionsResponse {
  positionss: { items: RawPosition[] };
}

// Transform raw position to typed Position with bigints
function transformPosition(raw: RawPosition): Position {
  return {
    ...raw,
    shares: BigInt(raw.shares),
    costBasis: BigInt(raw.costBasis),
  };
}

export function usePositions() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['positions', address],
    queryFn: async (): Promise<Position[]> => {
      if (!address) return [];
      const data = await graphqlClient.request<PositionsResponse>(POSITIONS_QUERY, {
        user: address.toLowerCase(),
      });
      return data.positionss.items.map(transformPosition);
    },
    enabled: !!address,
    staleTime: 5_000, // 5 seconds - positions change more frequently
  });
}

// Hook to get positions for a specific market
export function useMarketPositions(marketId: `0x${string}` | undefined) {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['positions', address, marketId],
    queryFn: async (): Promise<Position[]> => {
      if (!address || !marketId) return [];
      const data = await graphqlClient.request<PositionsResponse>(POSITIONS_QUERY, {
        user: address.toLowerCase(),
      });
      // Filter to just this market's positions
      return data.positionss.items
        .filter((p) => p.marketId.toLowerCase() === marketId.toLowerCase())
        .map(transformPosition);
    },
    enabled: !!address && !!marketId,
    staleTime: 5_000,
  });
}
