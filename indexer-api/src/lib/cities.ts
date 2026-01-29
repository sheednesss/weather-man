/**
 * City coordinates matching CityLib.sol
 * Coordinates are in decimal degrees for Open-Meteo API
 */

export interface City {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

/**
 * Cities matching CityLib.sol enum order:
 * - 0: NYC
 * - 1: CHICAGO
 * - 2: MIAMI
 * - 3: AUSTIN
 *
 * Coordinates converted from CityLib.sol (scaled by 10000) to decimal degrees
 */
export const CITIES: Record<number, City> = {
  0: {
    id: 0,
    name: "New York City",
    lat: 40.7128,  // 407128 / 10000
    lon: -74.0060, // -740060 / 10000
  },
  1: {
    id: 1,
    name: "Chicago",
    lat: 41.8781,  // 418781 / 10000
    lon: -87.6298, // -876298 / 10000
  },
  2: {
    id: 2,
    name: "Miami",
    lat: 25.7617,  // 257617 / 10000
    lon: -80.1918, // -801918 / 10000
  },
  3: {
    id: 3,
    name: "Austin",
    lat: 30.2672,  // 302672 / 10000
    lon: -97.7431, // -977431 / 10000
  },
};

/**
 * Get city by ID
 * @param cityId - City ID from CityLib.sol enum
 * @returns City data or undefined if not found
 */
export function getCity(cityId: number): City | undefined {
  return CITIES[cityId];
}

/**
 * Get all city IDs
 */
export function getAllCityIds(): number[] {
  return Object.keys(CITIES).map(Number);
}

/**
 * City ID to name mapping for display
 */
export const CITY_NAMES: Record<number, string> = {
  0: "NYC",
  1: "Chicago",
  2: "Miami",
  3: "Austin",
};
