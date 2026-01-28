import { TemperatureReading } from '../types/weather.js';
import { createRetryClient } from '../utils/retry.js';
import { logger } from '../utils/logger.js';
import { API_ENDPOINTS } from '../config/constants.js';

export async function fetchFromTomorrowIo(
  lat: number,
  lon: number,
  apiKey: string
): Promise<TemperatureReading | null> {
  try {
    const client = createRetryClient();
    const url = `${API_ENDPOINTS.TOMORROW}?location=${lat},${lon}&apikey=${apiKey}&units=imperial`;

    logger.debug(`Fetching from Tomorrow.io for (${lat}, ${lon})`);

    const response = await client.get(url);
    const temperature = response.data.data.values.temperature;

    logger.debug(`Tomorrow.io: (${lat}, ${lon}) = ${temperature}°F`);

    return {
      source: 'Tomorrow.io',
      temperature,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error(`Failed to fetch from Tomorrow.io for (${lat}, ${lon}):`, error);
    return null;
  }
}
