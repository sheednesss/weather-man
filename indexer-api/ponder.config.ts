import { createConfig, factory } from "ponder";
import { http } from "viem";
import { baseSepolia } from "viem/chains";

import MarketFactoryAbi from "./abis/MarketFactory.json";
import PredictionMarketAbi from "./abis/PredictionMarket.json";

// Find the MarketCreated event in the ABI
const marketCreatedEvent = (MarketFactoryAbi as readonly unknown[]).find(
  (item): item is { type: "event"; name: "MarketCreated"; inputs: readonly { name: string; type: string; indexed: boolean }[] } =>
    typeof item === "object" &&
    item !== null &&
    "type" in item &&
    item.type === "event" &&
    "name" in item &&
    item.name === "MarketCreated"
);

if (!marketCreatedEvent) {
  throw new Error("MarketCreated event not found in ABI");
}

export default createConfig({
  chains: {
    baseSepolia: {
      id: baseSepolia.id,
      transport: http(process.env.BASE_RPC_URL),
    },
  },
  contracts: {
    MarketFactory: {
      abi: MarketFactoryAbi as typeof MarketFactoryAbi,
      chain: "baseSepolia",
      address: process.env.MARKET_FACTORY_ADDRESS as `0x${string}`,
      startBlock: Number(process.env.START_BLOCK) || 0,
    },
    PredictionMarket: {
      abi: PredictionMarketAbi as typeof PredictionMarketAbi,
      chain: "baseSepolia",
      address: factory({
        address: process.env.MARKET_FACTORY_ADDRESS as `0x${string}`,
        event: marketCreatedEvent,
        parameter: "market",
      }),
      startBlock: Number(process.env.START_BLOCK) || 0,
    },
  },
});
