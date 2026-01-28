import { fetchFromOpenWeatherMap, fetchFromOpenMeteo, fetchFromTomorrowIo } from '../providers/index.js';
import { TemperatureReading, AggregatedTemperature } from '../types/weather.js';
import { CITIES, CityId } from '../config/constants.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function calculateMedian(readings: TemperatureReading[]): number {
  const temps = readings.map(r => r.temperature).sort((a, b) => a - b);
  const mid = Math.floor(temps.length / 2);
  return temps.length % 2 === 0
    ? (temps[mid - 1] + temps[mid]) / 2
    : temps[mid];
}

function validateTemperature(temp: number): boolean {
  // Sanity check: reasonable temperature range
  return temp >= -50 && temp <= 130;
}

export async function aggregateTemperature(cityId: CityId): Promise<AggregatedTemperature | null> {
  const city = CITIES[cityId];

  const results = await Promise.all([
    fetchFromOpenWeatherMap(city.name, env.OPENWEATHERMAP_API_KEY),
    fetchFromOpenMeteo(city.lat, city.lon),
    fetchFromTomorrowIo(city.lat, city.lon, env.TOMORROW_API_KEY),
  ]);

  const validReadings = results.filter((r): r is TemperatureReading =>
    r !== null && validateTemperature(r.temperature)
  );

  logger.info(`Weather fetch for ${cityId}: ${validReadings.length}/3 sources succeeded`);
  validReadings.forEach(r => logger.debug(`  ${r.source}: ${r.temperature}°F`));

  // Require at least 2 of 3 sources
  if (validReadings.length < 2) {
    logger.error(`FALLBACK TRIGGERED: Only ${validReadings.length}/3 sources for ${cityId}`);
    return null;
  }

  return {
    median: calculateMedian(validReadings),
    sources: validReadings.length,
    readings: validReadings,
  };
}
