import { TemperatureReading } from '../types/weather.js';
import { createRetryClient } from '../utils/retry.js';
import { logger } from '../utils/logger.js';
import { API_ENDPOINTS } from '../config/constants.js';

export async function fetchFromOpenWeatherMap(
  cityName: string,
  apiKey: string
): Promise<TemperatureReading | null> {
  try {
    const client = createRetryClient();
    const url = `${API_ENDPOINTS.OPENWEATHERMAP}?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=imperial`;

    logger.debug(`Fetching from OpenWeatherMap for ${cityName}`);

    const response = await client.get(url);
    const temperature = response.data.main.temp;

    logger.debug(`OpenWeatherMap: ${cityName} = ${temperature}°F`);

    return {
      source: 'OpenWeatherMap',
      temperature,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error(`Failed to fetch from OpenWeatherMap for ${cityName}:`, error);
    return null;
  }
}
