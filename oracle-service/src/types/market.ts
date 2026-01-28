import { CityId } from '../config/constants.js';

export interface MarketConfig {
  conditionId: string;
  questionId: string;
  city: CityId;
  resolutionTime: Date;
  lowerBound: number; // Temperature bracket lower bound (F)
  upperBound: number; // Temperature bracket upper bound (F)
}

export interface ResolutionResult {
  conditionId: string;
  temperature: number;
  outcome: 'YES' | 'NO';
  txHash: string;
}
