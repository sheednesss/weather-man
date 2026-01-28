import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkWalletBalance } from './services/blockchain.js';
import { aggregateTemperature } from './services/weather.js';
import { scheduleResolution, getScheduledMarkets } from './services/scheduler.js';
import { discoverMarkets } from './services/discovery.js';
import { CityId } from './config/constants.js';

async function healthCheck(): Promise<void> {
  logger.info('=== Oracle Service Health Check ===');

  // Check wallet balance
  const balance = await checkWalletBalance();
  logger.info(`Oracle wallet balance: ${balance} ETH`);
  if (parseFloat(balance) < 0.01) {
    logger.warn('Low wallet balance - may not have enough for gas');
  }

  // Test weather API connectivity (optional, only in development)
  if (env.NODE_ENV === 'development') {
    logger.info('Testing weather API connectivity...');
    const testCity: CityId = 'NYC';
    const weather = await aggregateTemperature(testCity);
    if (weather) {
      logger.info(`Weather test passed: ${testCity} = ${weather.median}°F (${weather.sources} sources)`);
    } else {
      logger.warn('Weather test failed - check API keys');
    }
  }

  logger.info('=== Health Check Complete ===');
}

async function main(): Promise<void> {
  logger.info('Starting Weather Oracle Service');
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Market Factory: ${env.MARKET_FACTORY_ADDRESS}`);

  await healthCheck();

  // Discover existing markets from chain and schedule for resolution
  if (env.MARKET_FACTORY_ADDRESS) {
    logger.info('Discovering markets from chain...');
    try {
      const markets = await discoverMarkets();
      logger.info(`Found ${markets.length} active market(s)`);

      // Schedule each discovered market for resolution
      for (const market of markets) {
        scheduleResolution({
          conditionId: market.conditionId,
          questionId: market.questionId,
          city: market.city,
          resolutionTime: market.resolutionTime,
          lowerBound: market.lowerBound,
          upperBound: market.upperBound,
        });
      }

      const scheduled = getScheduledMarkets();
      logger.info(`Oracle service initialized with ${scheduled.length} scheduled market(s)`);
    } catch (error) {
      logger.error('Failed to discover markets:', error);
      logger.warn('Continuing without market discovery - markets can be added manually');
    }
  } else {
    logger.warn('MARKET_FACTORY_ADDRESS not set - skipping market discovery');
    logger.info('Oracle service initialized (no markets scheduled)');
  }

  // Keep process alive
  logger.info('Oracle service running. Press Ctrl+C to stop.');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
