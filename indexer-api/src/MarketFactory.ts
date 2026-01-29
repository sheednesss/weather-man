import { ponder } from "ponder:registry";
import { markets } from "ponder:schema";

// City ID mapping from QuestionLib: 0=NYC, 1=CHICAGO, 2=MIAMI, 3=AUSTIN
const CITY_NAMES = ["NYC", "CHICAGO", "MIAMI", "AUSTIN"] as const;

/**
 * Decodes questionId to extract market parameters
 *
 * QuestionId encoding (from QuestionLib.sol):
 * - Bits 224-255: marketType (4 bytes)
 * - Bits 192-223: cityId (4 bytes, but only uses 1 byte)
 * - Bits 160-191: lowerBound (4 bytes, int32)
 * - Bits 128-159: upperBound (4 bytes, int32)
 * - Bits 64-127: resolutionTime (8 bytes)
 * - Bits 0-63: nonce (8 bytes)
 */
function decodeQuestionId(questionId: `0x${string}`): {
  cityId: string;
  lowerBound: number;
  upperBound: number;
  resolutionTime: bigint;
} {
  const qid = BigInt(questionId);

  // Extract cityId from bits 192-199 (byte 4)
  const cityIdNum = Number((qid >> 192n) & 0xFFn);
  const cityId = CITY_NAMES[cityIdNum] || "UNKNOWN";

  // Extract lowerBound from bits 160-191 (as int32)
  const lowerBoundRaw = Number((qid >> 160n) & 0xFFFFFFFFn);
  // Convert to signed int32
  const lowerBound = lowerBoundRaw > 0x7FFFFFFF
    ? lowerBoundRaw - 0x100000000
    : lowerBoundRaw;

  // Extract upperBound from bits 128-159 (as int32)
  const upperBoundRaw = Number((qid >> 128n) & 0xFFFFFFFFn);
  const upperBound = upperBoundRaw > 0x7FFFFFFF
    ? upperBoundRaw - 0x100000000
    : upperBoundRaw;

  // Extract resolutionTime from bits 64-127
  const resolutionTime = (qid >> 64n) & 0xFFFFFFFFFFFFFFFFn;

  return { cityId, lowerBound, upperBound, resolutionTime };
}

// Handler for MarketCreated event
ponder.on("MarketFactory:MarketCreated", async ({ event, context }) => {
  const { cityId, lowerBound, upperBound } = decodeQuestionId(
    event.args.questionId as `0x${string}`
  );

  await context.db.insert(markets).values({
    id: event.args.market,
    conditionId: event.args.conditionId,
    questionId: event.args.questionId,
    cityId,
    lowerBound,
    upperBound,
    resolutionTime: event.args.resolutionTime,
    createdAt: event.block.timestamp,
    volume: 0n,
    yesPool: 0n,
    noPool: 0n,
    resolved: false,
  });
});
