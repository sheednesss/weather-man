// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CityLib
/// @notice Library providing geographic coordinates for supported cities
/// @dev Coordinates are scaled by 10000 (e.g., 40.7128 becomes 407128) for precision
library CityLib {
    /// @notice Enum of supported city identifiers
    enum CityId {
        NYC,
        CHICAGO,
        MIAMI,
        AUSTIN
    }

    /// @notice Struct representing a city with coordinates
    /// @param name The city name
    /// @param lat Latitude scaled by 10000 (e.g., 40.7128 = 407128)
    /// @param lon Longitude scaled by 10000 (e.g., -74.0060 = -740060)
    struct City {
        string name;
        int32 lat;
        int32 lon;
    }

    /// @notice Gets city data for a given city ID
    /// @param cityId The city identifier
    /// @return City struct with name and coordinates
    function getCity(CityId cityId) internal pure returns (City memory) {
        if (cityId == CityId.NYC) {
            return City({
                name: "New York City",
                lat: 407128,
                lon: -740060
            });
        } else if (cityId == CityId.CHICAGO) {
            return City({
                name: "Chicago",
                lat: 418781,
                lon: -876298
            });
        } else if (cityId == CityId.MIAMI) {
            return City({
                name: "Miami",
                lat: 257617,
                lon: -801918
            });
        } else if (cityId == CityId.AUSTIN) {
            return City({
                name: "Austin",
                lat: 302672,
                lon: -977431
            });
        }

        // Should never reach here with valid enum
        revert("Invalid city ID");
    }

    /// @notice Gets the total number of supported cities
    /// @return The count of supported cities
    function getCityCount() internal pure returns (uint256) {
        return 4;
    }
}
