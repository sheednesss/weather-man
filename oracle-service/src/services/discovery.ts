import { Contract, ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getProvider } from './blockchain.js';
import { scheduleResolution } from './scheduler.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { CityId } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MarketFactoryABI = JSON.parse(
  readFileSync(join(__dirname, '../abis/MarketFactory.json'), 'utf-8')
);

/**
 * Information about a discovered market
 */
export interface MarketInfo {
  conditionId: string;
  marketAddress: string;
  questionId: string;
  city: CityId;
  lowerBound: number;
  upperBound: number;
  resolutionTime: Date;
}

/**
 * Map city ID number (from questionId encoding) to CityId string
 */
const CITY_ID_MAP: Record<number, CityId> = {
  0: 'NYC',
  1: 'CHICAGO',
  2: 'MIAMI',
  3: 'AUSTIN'
};

/**
 * Convert unsigned 32-bit to signed 32-bit integer
 * Required because Solidity int32 values are stored as uint32 in the encoding
 */
function toSignedInt32(n: number): number {
  return n > 0x7FFFFFFF ? n - 0x100000000 : n;
}

/**
 * Decode a questionId bytes32 to extract market parameters
 * Matches QuestionLib.sol encoding format
 */
function decodeQuestionId(questionId: string): {
  cityId: number;
  lowerBound: number;
  upperBound: number;
  resolutionTime: Date;
} {
  const bn = BigInt(questionId);

  // Extract fields per QuestionLib.sol encoding:
  // [0-3]:   Market type (0x01 = temperature) - bits 224-255
  // [4-7]:   City ID - bits 192-223 (but only uses 8 bits: uint8)
  // [8-11]:  Lower bound - bits 160-191
  // [12-15]: Upper bound - bits 128-159
  // [16-23]: Resolution timestamp - bits 64-127
  // [24-31]: Nonce - bits 0-63

  const cityId = Number((bn >> 192n) & 0xFFn);
  const lowerBoundRaw = Number((bn >> 160n) & 0xFFFFFFFFn);
  const upperBoundRaw = Number((bn >> 128n) & 0xFFFFFFFFn);
  const resolutionTimestamp = Number((bn >> 64n) & 0xFFFFFFFFFFFFFFFFn);

  return {
    cityId,
    lowerBound: toSignedInt32(lowerBoundRaw),
    upperBound: toSignedInt32(upperBoundRaw),
    resolutionTime: new Date(resolutionTimestamp * 1000)
  };
}

/**
 * Discover existing markets from MarketFactory MarketCreated events
 * Queries all historical events and filters out already-resolved markets
 * @returns Array of active markets ready for scheduling
 */
export async function discoverMarkets(): Promise<MarketInfo[]> {
  if (!env.MARKET_FACTORY_ADDRESS) {
    logger.warn('MARKET_FACTORY_ADDRESS not set - cannot discover markets');
    return [];
  }

  const provider = getProvider();

  // Create read-only contract instance (no wallet needed for queries)
  const factory = new ethers.Contract(
    env.MARKET_FACTORY_ADDRESS,
    MarketFactoryABI,
    provider
  );

  logger.info(`Querying MarketCreated events from factory ${env.MARKET_FACTORY_ADDRESS}`);

  // Query all MarketCreated events from block 0 to latest
  const filter = factory.filters.MarketCreated();
  const events = await factory.queryFilter(filter, 0, 'latest');

  logger.info(`Found ${events.length} MarketCreated event(s)`);

  const markets: MarketInfo[] = [];
  const now = new Date();

  for (const event of events) {
    // Type assertion for ethers v6 event
    const eventLog = event as ethers.EventLog;

    // Extract indexed args (conditionId, market address) and data (questionId, resolutionTime)
    const conditionId = eventLog.args[0] as string;
    const marketAddress = eventLog.args[1] as string;
    const questionId = eventLog.args[2] as string;

    // Decode questionId to get city and bracket info
    const decoded = decodeQuestionId(questionId);

    // Skip markets with resolution time in the past
    if (decoded.resolutionTime <= now) {
      logger.debug(`Skipping past market ${conditionId.slice(0, 10)}... (resolution was ${decoded.resolutionTime.toISOString()})`);
      continue;
    }

    // Map city ID to CityId string
    const city = CITY_ID_MAP[decoded.cityId];
    if (!city) {
      logger.warn(`Unknown city ID ${decoded.cityId} in market ${conditionId.slice(0, 10)}...`);
      continue;
    }

    const marketInfo: MarketInfo = {
      conditionId,
      marketAddress,
      questionId,
      city,
      lowerBound: decoded.lowerBound,
      upperBound: decoded.upperBound,
      resolutionTime: decoded.resolutionTime
    };

    markets.push(marketInfo);

    logger.info(
      `Discovered market: ${city} [${decoded.lowerBound}F - ${decoded.upperBound}F] ` +
      `resolves ${decoded.resolutionTime.toISOString()}`
    );
  }

  return markets;
}

/**
 * Discover markets and schedule them for automatic resolution
 * @returns Number of markets scheduled
 */
export async function discoverAndScheduleMarkets(): Promise<number> {
  const markets = await discoverMarkets();

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

  return markets.length;
}
