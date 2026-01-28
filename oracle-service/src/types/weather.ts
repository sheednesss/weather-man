export interface TemperatureReading {
  source: string;
  temperature: number; // Fahrenheit
  timestamp: number;   // Unix ms
}

export interface AggregatedTemperature {
  median: number;
  sources: number;
  readings: TemperatureReading[];
}
