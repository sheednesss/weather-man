// Market types matching Ponder schema (indexer-api/ponder.schema.ts)

export type CityId = 'NYC' | 'CHICAGO' | 'MIAMI' | 'AUSTIN';

export interface Market {
  id: `0x${string}`;           // Market contract address
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  cityId: CityId;
  lowerBound: number;          // Temperature lower bound (scaled by 100)
  upperBound: number;          // Temperature upper bound (scaled by 100)
  resolutionTime: bigint;
  createdAt: bigint;
  volume: bigint;              // Total USDC volume
  yesPool: bigint;
  noPool: bigint;
  resolved: boolean;
}

export interface WeatherData {
  current: {
    temperature: number;
    conditions: string;
  };
  forecast: {
    high: number;
    low: number;
  };
  cityName: string;
}

export interface MarketWithWeather extends Market {
  weather: WeatherData | null;
}

// Helper to format temperature from scaled value (divided by 100)
export function formatTemperature(scaled: number): string {
  return `${(scaled / 100).toFixed(0)}`;
}

// Helper to get city display name
export function getCityDisplayName(cityId: CityId): string {
  const names: Record<CityId, string> = {
    NYC: 'New York City',
    CHICAGO: 'Chicago',
    MIAMI: 'Miami',
    AUSTIN: 'Austin',
  };
  return names[cityId];
}

// Helper to calculate implied probability from pool sizes
export function calculateYesProbability(yesPool: bigint, noPool: bigint): number {
  const total = yesPool + noPool;
  if (total === 0n) return 50; // Default to 50% if no liquidity
  return Number((yesPool * 100n) / total);
}
