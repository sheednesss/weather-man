// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CityLib} from "./CityLib.sol";

library QuestionLib {
    // Question ID format (32 bytes):
    // [0-3]:   Market type (0x01 = temperature)
    // [4-7]:   City ID (0-3 for NYC/Chicago/Miami/Austin)
    // [8-11]:  Lower bound (temperature in F, scaled by 100)
    // [12-15]: Upper bound (temperature in F, scaled by 100, 0xFFFF = +infinity)
    // [16-23]: Resolution timestamp
    // [24-31]: Nonce (for uniqueness)

    uint32 constant MARKET_TYPE_TEMPERATURE = 0x01;
    uint32 constant UPPER_BOUND_INFINITY = 0xFFFFFFFF;

    struct TemperatureBracket {
        int32 lowerBound;  // Temperature in F (e.g., 80)
        int32 upperBound;  // Temperature in F (e.g., 85), or type(int32).max for +inf
    }

    function encodeQuestionId(
        CityLib.CityId cityId,
        int32 lowerBound,
        int32 upperBound,
        uint64 resolutionTime,
        uint64 nonce
    ) internal pure returns (bytes32) {
        return bytes32(
            (uint256(MARKET_TYPE_TEMPERATURE) << 224) |
            (uint256(uint8(cityId)) << 192) |
            (uint256(uint32(lowerBound)) << 160) |
            (uint256(uint32(upperBound)) << 128) |
            (uint256(resolutionTime) << 64) |
            uint256(nonce)
        );
    }

    function decodeQuestionId(bytes32 questionId) internal pure returns (
        uint32 marketType,
        CityLib.CityId cityId,
        int32 lowerBound,
        int32 upperBound,
        uint64 resolutionTime,
        uint64 nonce
    ) {
        marketType = uint32(uint256(questionId) >> 224);
        cityId = CityLib.CityId(uint8(uint256(questionId) >> 192));
        lowerBound = int32(uint32(uint256(questionId) >> 160));
        upperBound = int32(uint32(uint256(questionId) >> 128));
        resolutionTime = uint64(uint256(questionId) >> 64);
        nonce = uint64(uint256(questionId));
    }

    // Standard temperature brackets (Fahrenheit)
    function getStandardBrackets() internal pure returns (TemperatureBracket[] memory) {
        TemperatureBracket[] memory brackets = new TemperatureBracket[](5);
        brackets[0] = TemperatureBracket({lowerBound: type(int32).min, upperBound: 70});  // Below 70
        brackets[1] = TemperatureBracket({lowerBound: 70, upperBound: 80});               // 70-80
        brackets[2] = TemperatureBracket({lowerBound: 80, upperBound: 85});               // 80-85
        brackets[3] = TemperatureBracket({lowerBound: 85, upperBound: 90});               // 85-90
        brackets[4] = TemperatureBracket({lowerBound: 90, upperBound: type(int32).max}); // 90+
        return brackets;
    }
}
