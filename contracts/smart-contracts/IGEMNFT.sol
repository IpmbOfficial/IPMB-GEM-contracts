// SPDX-License-Identifier: MIT

/**
 *
 * @title GEMNFT Interface
 */

pragma solidity ^0.8.5;

interface IGEMNFT {

    function retrieveCategoryData(string memory _id) external view returns (uint256, uint256, uint256, uint256, bool);

    function contractIsActive() external view returns (bool);

    function mintGEMNFTAUTH(string memory _id, address _receiver) external;
}