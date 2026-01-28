// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MarketFactory} from "../src/MarketFactory.sol";
import {CityLib} from "../src/libraries/CityLib.sol";
import {QuestionLib} from "../src/libraries/QuestionLib.sol";

contract CreateTemperatureMarkets is Script {
    function run() external {
        address factoryAddress = vm.envAddress("MARKET_FACTORY_ADDRESS");
        MarketFactory factory = MarketFactory(factoryAddress);

        // Resolution time: tomorrow at noon UTC (for demo purposes)
        uint64 resolutionTime = uint64(block.timestamp + 1 days);

        vm.startBroadcast();

        uint64 nonce = 0;

        // Create markets for each city
        CityLib.CityId[4] memory cities = [
            CityLib.CityId.NYC,
            CityLib.CityId.CHICAGO,
            CityLib.CityId.MIAMI,
            CityLib.CityId.AUSTIN
        ];

        // Standard brackets: [<70], [70-80], [80-85], [85-90], [90+]
        QuestionLib.TemperatureBracket[] memory brackets = QuestionLib.getStandardBrackets();

        for (uint256 i = 0; i < cities.length; i++) {
            CityLib.CityId cityId = cities[i];
            CityLib.City memory city = CityLib.getCity(cityId);

            console.log("Creating markets for:", city.name);

            for (uint256 j = 0; j < brackets.length; j++) {
                bytes32 questionId = QuestionLib.encodeQuestionId(
                    cityId,
                    brackets[j].lowerBound,
                    brackets[j].upperBound,
                    resolutionTime,
                    nonce++
                );

                address market = factory.createMarket(questionId, resolutionTime);

                console.log("  Bracket", j, "market:", market);
            }
        }

        vm.stopBroadcast();

        console.log("Created", cities.length * brackets.length, "temperature bracket markets");
    }

    // Utility function to create markets with custom resolution time
    function createMarketsForDate(
        address factoryAddress,
        uint64 resolutionTime
    ) external {
        MarketFactory factory = MarketFactory(factoryAddress);

        vm.startBroadcast();

        uint64 nonce = uint64(resolutionTime); // Use timestamp as nonce base for uniqueness

        CityLib.CityId[4] memory cities = [
            CityLib.CityId.NYC,
            CityLib.CityId.CHICAGO,
            CityLib.CityId.MIAMI,
            CityLib.CityId.AUSTIN
        ];

        QuestionLib.TemperatureBracket[] memory brackets = QuestionLib.getStandardBrackets();

        for (uint256 i = 0; i < cities.length; i++) {
            for (uint256 j = 0; j < brackets.length; j++) {
                bytes32 questionId = QuestionLib.encodeQuestionId(
                    cities[i],
                    brackets[j].lowerBound,
                    brackets[j].upperBound,
                    resolutionTime,
                    nonce++
                );

                factory.createMarket(questionId, resolutionTime);
            }
        }

        vm.stopBroadcast();
    }
}
