import NodeCache from "node-cache";
import axios from "axios";
import { CITIES, getCity, getAllCityIds, type City } from "./cities.js";

/**
 * WMO Weather interpretation codes
 * https://open-meteo.com/en/docs#weathervariables
 */
const WMO_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

/**
 * Weather data for a single city
 */
export interface WeatherData {
  cityId: number;
  cityName: string;
  current: {
    temperature: number; // Fahrenheit
    weatherCode: number;
    weatherDescription: string;
    time: string;
  };
  forecast: ForecastDay[];
  fetchedAt: string;
}

/**
 * Single day forecast
 */
export interface ForecastDay {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  weatherDescription: string;
}

/**
 * Open-Meteo API response structure
 */
interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

// Cache with 15-minute TTL (900 seconds)
const weatherCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

/**
 * Fetch weather data from Open-Meteo API
 */
async function fetchFromOpenMeteo(lat: number, lon: number): Promise<OpenMeteoResponse> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const response = await axios.get<OpenMeteoResponse>(url.toString());
  return response.data;
}

/**
 * Get weather description from WMO code
 */
function getWeatherDescription(code: number): string {
  return WMO_CODES[code] ?? "Unknown";
}

/**
 * Get weather for a single city with caching
 * @param cityId - City ID from CityLib.sol enum (0-3)
 * @returns Weather data or null if city not found
 */
export async function getWeather(cityId: number): Promise<WeatherData | null> {
  const city = getCity(cityId);
  if (!city) {
    return null;
  }

  // Check cache first
  const cacheKey = `weather_${cityId}`;
  const cached = weatherCache.get<WeatherData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchFromOpenMeteo(city.lat, city.lon);

    const weatherData: WeatherData = {
      cityId: city.id,
      cityName: city.name,
      current: {
        temperature: Math.round(data.current.temperature_2m),
        weatherCode: data.current.weather_code,
        weatherDescription: getWeatherDescription(data.current.weather_code),
        time: data.current.time,
      },
      forecast: data.daily.time.map((date, i) => ({
        date,
        temperatureMax: Math.round(data.daily.temperature_2m_max[i]),
        temperatureMin: Math.round(data.daily.temperature_2m_min[i]),
        weatherCode: data.daily.weather_code[i],
        weatherDescription: getWeatherDescription(data.daily.weather_code[i]),
      })),
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    weatherCache.set(cacheKey, weatherData);

    return weatherData;
  } catch (error) {
    console.error(`Failed to fetch weather for city ${cityId}:`, error);
    return null;
  }
}

/**
 * Get weather for all cities
 * @returns Array of weather data for all cities
 */
export async function getAllWeather(): Promise<WeatherData[]> {
  const cityIds = getAllCityIds();
  const results = await Promise.all(cityIds.map((id) => getWeather(id)));
  return results.filter((w): w is WeatherData => w !== null);
}

/**
 * Clear the weather cache
 * Useful for testing or forcing refresh
 */
export function clearWeatherCache(): void {
  weatherCache.flushAll();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { hits: number; misses: number; keys: number } {
  const stats = weatherCache.getStats();
  return {
    hits: stats.hits,
    misses: stats.misses,
    keys: weatherCache.keys().length,
  };
}

// Re-export city utilities for convenience
export { CITIES, getCity, getAllCityIds, type City };
