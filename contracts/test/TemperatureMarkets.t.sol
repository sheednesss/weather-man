// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";
import {SimpleConditionalTokens} from "../src/SimpleConditionalTokens.sol";
import {CityLib} from "../src/libraries/CityLib.sol";
import {QuestionLib} from "../src/libraries/QuestionLib.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

contract TemperatureMarketsTest is Test {
    MarketFactory factory;
    SimpleConditionalTokens ctf;
    MockUSDC collateral;

    function setUp() public {
        collateral = new MockUSDC();
        ctf = new SimpleConditionalTokens();
        factory = new MarketFactory(address(ctf), address(collateral));
    }

    function test_QuestionLib_encodeDecodeRoundtrip() public pure {
        CityLib.CityId cityId = CityLib.CityId.NYC;
        int32 lowerBound = 80;
        int32 upperBound = 85;
        uint64 resolutionTime = 1700000000;
        uint64 nonce = 42;

        bytes32 questionId = QuestionLib.encodeQuestionId(
            cityId, lowerBound, upperBound, resolutionTime, nonce
        );

        (
            uint32 decodedType,
            CityLib.CityId decodedCity,
            int32 decodedLower,
            int32 decodedUpper,
            uint64 decodedTime,
            uint64 decodedNonce
        ) = QuestionLib.decodeQuestionId(questionId);

        assertEq(decodedType, QuestionLib.MARKET_TYPE_TEMPERATURE);
        assertEq(uint8(decodedCity), uint8(cityId));
        assertEq(decodedLower, lowerBound);
        assertEq(decodedUpper, upperBound);
        assertEq(decodedTime, resolutionTime);
        assertEq(decodedNonce, nonce);
    }

    function test_QuestionLib_allCitiesEncode() public pure {
        CityLib.CityId[4] memory cities = [
            CityLib.CityId.NYC,
            CityLib.CityId.CHICAGO,
            CityLib.CityId.MIAMI,
            CityLib.CityId.AUSTIN
        ];

        for (uint256 i = 0; i < cities.length; i++) {
            bytes32 questionId = QuestionLib.encodeQuestionId(
                cities[i], 80, 85, 1700000000, uint64(i)
            );

            (, CityLib.CityId decodedCity,,,, ) = QuestionLib.decodeQuestionId(questionId);
            assertEq(uint8(decodedCity), uint8(cities[i]));
        }
    }

    function test_QuestionLib_standardBrackets() public pure {
        QuestionLib.TemperatureBracket[] memory brackets = QuestionLib.getStandardBrackets();

        assertEq(brackets.length, 5);
        // Check bracket 2: [80, 85)
        assertEq(brackets[2].lowerBound, 80);
        assertEq(brackets[2].upperBound, 85);
    }

    function test_createMarketsForAllCities() public {
        CityLib.CityId[4] memory cities = [
            CityLib.CityId.NYC,
            CityLib.CityId.CHICAGO,
            CityLib.CityId.MIAMI,
            CityLib.CityId.AUSTIN
        ];

        uint64 resolutionTime = uint64(block.timestamp + 1 days);
        QuestionLib.TemperatureBracket[] memory brackets = QuestionLib.getStandardBrackets();

        uint256 marketsCreated = 0;

        for (uint256 i = 0; i < cities.length; i++) {
            for (uint256 j = 0; j < 3; j++) { // Create 3 brackets per city for test
                bytes32 questionId = QuestionLib.encodeQuestionId(
                    cities[i],
                    brackets[j].lowerBound,
                    brackets[j].upperBound,
                    resolutionTime,
                    uint64(marketsCreated)
                );

                address market = factory.createMarket(questionId, resolutionTime);
                assertTrue(market != address(0), "Market should be created");

                // Verify market's questionId matches
                PredictionMarket pm = PredictionMarket(market);
                assertEq(pm.questionId(), questionId);

                marketsCreated++;
            }
        }

        // 4 cities x 3 brackets = 12 markets
        assertEq(marketsCreated, 12);
    }

    function test_marketQuestionIdParsableByOracle() public {
        // Simulate oracle parsing a questionId
        CityLib.CityId expectedCity = CityLib.CityId.MIAMI;
        int32 expectedLower = 85;
        int32 expectedUpper = 90;
        uint64 resolutionTime = uint64(block.timestamp + 1 days);

        bytes32 questionId = QuestionLib.encodeQuestionId(
            expectedCity, expectedLower, expectedUpper, resolutionTime, 0
        );

        address marketAddr = factory.createMarket(questionId, resolutionTime);
        PredictionMarket market = PredictionMarket(marketAddr);

        // Oracle would decode the questionId from the market
        bytes32 storedQuestionId = market.questionId();

        (
            ,
            CityLib.CityId cityId,
            int32 lower,
            int32 upper,
            ,
        ) = QuestionLib.decodeQuestionId(storedQuestionId);

        // Oracle now knows:
        // - Fetch weather for Miami (cityId = 2)
        // - Check if temp is in [85, 90)
        assertEq(uint8(cityId), uint8(CityLib.CityId.MIAMI));
        assertEq(lower, 85);
        assertEq(upper, 90);

        // Get city coordinates for API call
        CityLib.City memory city = CityLib.getCity(cityId);
        assertEq(city.name, "Miami");
        assertEq(city.lat, 257617); // 25.7617
    }
}
