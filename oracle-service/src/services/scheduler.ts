import cron from 'node-cron';
import { MarketConfig } from '../types/market.js';
import { aggregateTemperature } from './weather.js';
import { resolveMarket } from './blockchain.js';
import { logger } from '../utils/logger.js';

const scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

export function scheduleResolution(market: MarketConfig): void {
  const resolutionTime = new Date(market.resolutionTime);

  // Add 1 minute delay to ensure weather data is available
  const scheduledTime = new Date(resolutionTime.getTime() + 60 * 1000);

  // Generate cron expression (minute hour dayOfMonth month dayOfWeek)
  const cronExpression = `${scheduledTime.getUTCMinutes()} ${scheduledTime.getUTCHours()} ${scheduledTime.getUTCDate()} ${scheduledTime.getUTCMonth() + 1} *`;

  const task = cron.schedule(cronExpression, async () => {
    logger.info(`Running scheduled resolution for market ${market.conditionId}`);

    try {
      const weather = await aggregateTemperature(market.city);

      if (!weather) {
        logger.error(`RESOLUTION FAILED: Could not aggregate weather for ${market.city}`);
        logger.error(`Manual intervention required for market ${market.conditionId}`);
        return;
      }

      const txHash = await resolveMarket({
        conditionId: market.conditionId,
        temperature: weather.median,
        lowerBound: market.lowerBound,
        upperBound: market.upperBound,
      });

      logger.info(`Market ${market.conditionId} resolved successfully: ${txHash}`);
    } catch (error) {
      logger.error(`Resolution error for ${market.conditionId}:`, error);
    }

    // Remove job after execution
    scheduledJobs.delete(market.conditionId);
  }, {
    timezone: 'UTC'
  });

  scheduledJobs.set(market.conditionId, task);
  logger.info(`Scheduled resolution for ${market.conditionId} at ${scheduledTime.toISOString()}`);
}

export function cancelResolution(conditionId: string): boolean {
  const task = scheduledJobs.get(conditionId);
  if (task) {
    task.stop();
    scheduledJobs.delete(conditionId);
    logger.info(`Cancelled resolution for ${conditionId}`);
    return true;
  }
  return false;
}

export function getScheduledMarkets(): string[] {
  return Array.from(scheduledJobs.keys());
}
