import { useQuery } from '@tanstack/react-query';
import type { MarketWithWeather, CityId, WeatherData } from '@/types/market';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:42069';

// Raw response from API (strings for bigint fields)
interface RawMarketWithWeather {
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
  weather: WeatherData | null;
}

interface MarketsWithWeatherResponse {
  markets: RawMarketWithWeather[];
  totalMarkets: number;
  weatherCacheStats: { hits: number; misses: number };
}

// Transform raw market to typed MarketWithWeather with bigints
function transformMarket(raw: RawMarketWithWeather): MarketWithWeather {
  return {
    id: raw.id,
    conditionId: raw.conditionId,
    questionId: raw.questionId,
    cityId: raw.cityId as CityId,
    lowerBound: raw.lowerBound,
    upperBound: raw.upperBound,
    resolutionTime: BigInt(raw.resolutionTime),
    createdAt: BigInt(raw.createdAt),
    volume: BigInt(raw.volume),
    yesPool: BigInt(raw.yesPool),
    noPool: BigInt(raw.noPool),
    resolved: raw.resolved,
    weather: raw.weather,
  };
}

export function useMarketsWithWeather() {
  return useQuery({
    queryKey: ['markets-with-weather'],
    queryFn: async (): Promise<MarketWithWeather[]> => {
      const response = await fetch(`${API_URL}/markets-with-weather`);
      if (!response.ok) throw new Error('Failed to fetch markets with weather');
      const data: MarketsWithWeatherResponse = await response.json();
      // Transform and sort by volume descending (hot markets first)
      const markets = data.markets.map(transformMarket);
      return markets.sort((a, b) => Number(b.volume - a.volume));
    },
    staleTime: 30_000, // 30 seconds - weather updates less frequently
  });
}

// Hook to get weather for a specific city
export function useWeather(cityId: CityId | undefined) {
  return useQuery({
    queryKey: ['weather', cityId],
    queryFn: async (): Promise<WeatherData | null> => {
      if (!cityId) return null;
      const response = await fetch(`${API_URL}/weather/${cityId}`);
      if (!response.ok) {
        if (response.status === 400) return null; // Invalid city
        throw new Error('Failed to fetch weather');
      }
      return response.json();
    },
    enabled: !!cityId,
    staleTime: 60_000, // 1 minute for individual weather queries
  });
}
