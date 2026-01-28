import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MarketFactoryABI = JSON.parse(
  readFileSync(join(__dirname, '../abis/MarketFactory.json'), 'utf-8')
);

let provider: JsonRpcProvider | null = null;
let wallet: Wallet | null = null;
let marketFactory: Contract | null = null;

export function getProvider(): JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
  }
  return provider;
}

export function getWallet(): Wallet {
  if (!wallet) {
    if (!env.ORACLE_PRIVATE_KEY) {
      throw new Error('ORACLE_PRIVATE_KEY is required');
    }
    wallet = new ethers.Wallet(env.ORACLE_PRIVATE_KEY, getProvider());
  }
  return wallet;
}

export function getMarketFactoryContract(): Contract {
  if (!marketFactory) {
    if (!env.MARKET_FACTORY_ADDRESS) {
      throw new Error('MARKET_FACTORY_ADDRESS is required');
    }
    marketFactory = new ethers.Contract(
      env.MARKET_FACTORY_ADDRESS,
      MarketFactoryABI,
      getWallet()
    );
  }
  return marketFactory;
}

export async function checkWalletBalance(): Promise<string> {
  const balance = await getProvider().getBalance(getWallet().address);
  return ethers.formatEther(balance);
}

export interface ResolutionParams {
  conditionId: string;
  temperature: number;
  lowerBound: number;
  upperBound: number;
}

export async function resolveMarket(params: ResolutionParams): Promise<string> {
  const { conditionId, temperature, lowerBound, upperBound } = params;

  // Determine outcome: YES if temperature is within bracket [lower, upper)
  const isWithinBracket = temperature >= lowerBound && temperature < upperBound;
  const payouts = isWithinBracket ? [1, 0] : [0, 1]; // [YES, NO]

  logger.info(`Resolving market ${conditionId}`);
  logger.info(`  Temperature: ${temperature}°F, Bracket: [${lowerBound}, ${upperBound})`);
  logger.info(`  Outcome: ${isWithinBracket ? 'YES' : 'NO'} wins (payouts: [${payouts}])`);

  const factory = getMarketFactoryContract();

  // Estimate gas with 25% buffer
  const gasEstimate = await factory.resolveMarket.estimateGas(conditionId, payouts);
  const gasLimit = (gasEstimate * 125n) / 100n;

  logger.debug(`Gas estimate: ${gasEstimate}, using limit: ${gasLimit}`);

  const tx = await factory.resolveMarket(conditionId, payouts, { gasLimit });
  logger.info(`Transaction submitted: ${tx.hash}`);

  const receipt = await tx.wait();
  logger.info(`Market resolved in block ${receipt.blockNumber}`);

  return tx.hash;
}
