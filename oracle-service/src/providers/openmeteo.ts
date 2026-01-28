import { TemperatureReading } from '../types/weather.js';
import { createRetryClient } from '../utils/retry.js';
import { logger } from '../utils/logger.js';
import { API_ENDPOINTS } from '../config/constants.js';

export async function fetchFromOpenMeteo(
  lat: number,
  lon: number
): Promise<TemperatureReading | null> {
  try {
    const client = createRetryClient();
    const url = `${API_ENDPOINTS.OPENMETEO}?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=fahrenheit`;

    logger.debug(`Fetching from Open-Meteo for (${lat}, ${lon})`);

    const response = await client.get(url);
    const temperature = response.data.current.temperature_2m;

    logger.debug(`Open-Meteo: (${lat}, ${lon}) = ${temperature}°F`);

    return {
      source: 'Open-Meteo',
      temperature,
      timestamp: Date.now()
    };
  } catch (error) {
    logger.error(`Failed to fetch from Open-Meteo for (${lat}, ${lon}):`, error);
    return null;
  }
}
