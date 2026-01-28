// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";

contract ExportAbi is Script {
    function run() external view {
        // This script just ensures contracts compile
        // ABI is extracted using: forge inspect MarketFactory abi
    }
}
