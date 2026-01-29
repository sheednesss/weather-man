import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphqlClient } from '@/lib/graphql';
import type { Market, CityId } from '@/types/market';

// Note: Ponder generates plural table names with double 's' (marketss)
const MARKETS_QUERY = gql`
  query GetMarkets($orderBy: String, $orderDirection: String) {
    marketss(orderBy: $orderBy, orderDirection: $orderDirection) {
      items {
        id
        conditionId
        questionId
        cityId
        lowerBound
        upperBound
        resolutionTime
        createdAt
        volume
        yesPool
        noPool
        resolved
      }
    }
  }
`;

// Raw response from GraphQL (strings for bigint fields)
interface RawMarket {
  id: `0x${string}`;
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  cityId: string;
  lowerBound: number;
  upperBound: number;
  resolutionTime: string;
  createdAt: string;
  volume: string;
  yesPool: string;
  noPool: string;
  resolved: boolean;
}

interface MarketsResponse {
  marketss: { items: RawMarket[] };
}

// Transform raw market to typed Market with bigints
function transformMarket(raw: RawMarket): Market {
  return {
    ...raw,
    cityId: raw.cityId as CityId,
    resolutionTime: BigInt(raw.resolutionTime),
    createdAt: BigInt(raw.createdAt),
    volume: BigInt(raw.volume),
    yesPool: BigInt(raw.yesPool),
    noPool: BigInt(raw.noPool),
  };
}

export function useMarkets(sortBy: 'volume' | 'createdAt' = 'volume') {
  return useQuery({
    queryKey: ['markets', sortBy],
    queryFn: async (): Promise<Market[]> => {
      const data = await graphqlClient.request<MarketsResponse>(MARKETS_QUERY, {
        orderBy: sortBy,
        orderDirection: 'desc',
      });
      return data.marketss.items.map(transformMarket);
    },
    staleTime: 10_000, // 10 seconds
  });
}

// Hook to get a single market by ID
const MARKET_QUERY = gql`
  query GetMarket($id: String!) {
    markets(id: $id) {
      id
      conditionId
      questionId
      cityId
      lowerBound
      upperBound
      resolutionTime
      createdAt
      volume
      yesPool
      noPool
      resolved
    }
  }
`;

interface MarketResponse {
  markets: RawMarket | null;
}

export function useMarket(id: `0x${string}` | undefined) {
  return useQuery({
    queryKey: ['market', id],
    queryFn: async (): Promise<Market | null> => {
      if (!id) return null;
      const data = await graphqlClient.request<MarketResponse>(MARKET_QUERY, { id });
      return data.markets ? transformMarket(data.markets) : null;
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}
