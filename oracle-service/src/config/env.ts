import { cleanEnv, str, url } from 'envalid';

export const env = cleanEnv(process.env, {
  // Blockchain
  BASE_RPC_URL: url({
    desc: 'Base network RPC URL'
  }),
  ORACLE_PRIVATE_KEY: str({
    desc: 'Private key for oracle wallet',
    default: undefined
  }),
  MARKET_FACTORY_ADDRESS: str({
    desc: 'Deployed MarketFactory contract address',
    default: undefined
  }),

  // Weather APIs
  OPENWEATHERMAP_API_KEY: str({
    desc: 'OpenWeatherMap API key'
  }),
  TOMORROW_API_KEY: str({
    desc: 'Tomorrow.io API key'
  }),

  // Config
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development'
  })
});

// Validate Ethereum addresses start with 0x
if (env.ORACLE_PRIVATE_KEY && !env.ORACLE_PRIVATE_KEY.startsWith('0x')) {
  throw new Error('ORACLE_PRIVATE_KEY must start with 0x');
}

if (env.MARKET_FACTORY_ADDRESS && !env.MARKET_FACTORY_ADDRESS.startsWith('0x')) {
  throw new Error('MARKET_FACTORY_ADDRESS must start with 0x');
}
