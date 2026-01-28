export type CityId = 'NYC' | 'CHICAGO' | 'MIAMI' | 'AUSTIN';

export interface CityInfo {
  name: string;
  lat: number;
  lon: number;
}

export const CITIES: Record<CityId, CityInfo> = {
  NYC: {
    name: 'New York City',
    lat: 40.7128,
    lon: -74.0060
  },
  CHICAGO: {
    name: 'Chicago',
    lat: 41.8781,
    lon: -87.6298
  },
  MIAMI: {
    name: 'Miami',
    lat: 25.7617,
    lon: -80.1918
  },
  AUSTIN: {
    name: 'Austin',
    lat: 30.2672,
    lon: -97.7431
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  OPENWEATHERMAP: 'https://api.openweathermap.org/data/2.5/weather',
  OPENMETEO: 'https://api.open-meteo.com/v1/forecast',
  TOMORROW: 'https://api.tomorrow.io/v4/weather/realtime'
};
