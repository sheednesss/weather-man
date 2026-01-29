import { Hono } from "hono";
import { cors } from "hono/cors";
import { graphql } from "ponder";
import { db } from "ponder:api";
import schema from "ponder:schema";
import { getWeather, getAllWeather, getCacheStats, type WeatherData } from "../lib/weather.js";
import auth from "./auth.js";

/**
 * Custom Hono routes for Weather Man API
 *
 * These routes extend Ponder's auto-generated GraphQL API with:
 * - Weather data endpoints (with caching)
 * - Combined markets + weather endpoints
 * - SIWE authentication
 */

const app = new Hono();

// CORS middleware - must be before other routes
// Allow credentials for session cookies
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Mount auth routes at /auth
app.route("/auth", auth);

// Mount Ponder's auto-generated GraphQL API at /graphql and root
app.use("/graphql", graphql({ db, schema }));
app.use("/", graphql({ db, schema }));

/**
 * Get weather for a single city
 * GET /weather/:cityId
 *
 * @param cityId - City ID from CityLib.sol enum (0=NYC, 1=Chicago, 2=Miami, 3=Austin)
 */
app.get("/weather/:cityId", async (c) => {
  const cityIdParam = c.req.param("cityId");
  const cityId = parseInt(cityIdParam, 10);

  if (isNaN(cityId) || cityId < 0 || cityId > 3) {
    return c.json(
      { error: "Invalid cityId. Must be 0 (NYC), 1 (Chicago), 2 (Miami), or 3 (Austin)" },
      400
    );
  }

  const weather = await getWeather(cityId);
  if (!weather) {
    return c.json({ error: "Failed to fetch weather data" }, 500);
  }

  return c.json(weather);
});

/**
 * Get weather for all cities
 * GET /weather
 */
app.get("/weather", async (c) => {
  const weather = await getAllWeather();
  return c.json({
    cities: weather,
    cacheStats: getCacheStats(),
  });
});

/**
 * Get markets with embedded weather data
 * GET /markets-with-weather
 *
 * Combines market data from Ponder's database with live weather
 */
app.get("/markets-with-weather", async (c) => {
  try {
    // Get all markets from Ponder's database using Drizzle
    const markets = await db.select().from(schema.markets).orderBy(schema.markets.createdAt);

    // Fetch weather for all cities in parallel
    const weatherData = await getAllWeather();
    const weatherByCity = new Map<number, WeatherData>();
    for (const w of weatherData) {
      weatherByCity.set(w.cityId, w);
    }

    // Enrich markets with weather data
    const marketsWithWeather = markets.map((market) => {
      const cityId = typeof market.cityId === 'number' ? market.cityId : parseInt(String(market.cityId), 10);
      const weather = weatherByCity.get(cityId);

      return {
        ...market,
        weather: weather
          ? {
              current: weather.current,
              forecast: weather.forecast,
              cityName: weather.cityName,
            }
          : null,
      };
    });

    return c.json({
      markets: marketsWithWeather,
      totalMarkets: marketsWithWeather.length,
      weatherCacheStats: getCacheStats(),
    });
  } catch (error) {
    console.error("Error fetching markets with weather:", error);
    return c.json({ error: "Failed to fetch markets" }, 500);
  }
});

/**
 * Get cache statistics
 * GET /cache-stats
 */
app.get("/cache-stats", (c) => {
  return c.json(getCacheStats());
});

export default app;
