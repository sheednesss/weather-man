import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkWalletBalance } from './services/blockchain.js';
import { aggregateTemperature } from './services/weather.js';
import { scheduleResolution, getScheduledMarkets } from './services/scheduler.js';
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

  // In production, markets would be loaded from chain events or database
  // For now, log that service is ready
  logger.info('Oracle service initialized and ready');
  logger.info('Scheduled markets:', getScheduledMarkets());

  // Keep process alive
  logger.info('Oracle service running. Press Ctrl+C to stop.');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
