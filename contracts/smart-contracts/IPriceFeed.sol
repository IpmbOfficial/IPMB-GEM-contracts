// SPDX-License-Identifier: MIT

/**
 *
 * @title Price Feed Interface
 */

pragma solidity ^0.8.5;

interface IPriceFeed {

    function getLatestPrices() external view returns (uint256, uint256, uint256, uint256, bytes32, uint256);

    function getEpochPrices(uint256 _epoch) external view returns (uint256, uint256, uint256, bytes32, uint256);

    function getEpochDataSetHash(uint256 _epoch) external view returns (bytes32, bytes32);

}