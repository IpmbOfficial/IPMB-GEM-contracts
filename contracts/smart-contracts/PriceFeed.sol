// SPDX-License-Identifier: MIT

/**
 *
 *  @title: Price Feed Contract
 *  @date: 26-November-2024
 *  @version: 2.3
 *  @author: IPMB Dev Team
 */

import "./Ownable.sol";
import "./Strings.sol";

pragma solidity ^0.8.19;

contract PriceFeed is Ownable {

    // struct

    struct Data {
        uint256 goldPro;
        uint256 gold;
        uint256 goldDaily;
        bytes32 epochAvgPriceHash;
        bytes32 epochGoldDataSetHash;
        bytes32 epochGoldProDataSetHash;
        uint256 epochTS;
    }

    // mappings declaration

    mapping (address => bool) public admin;
    mapping (uint256 => Data) public PriceFeedData;

    // variables declaration

    using Strings for uint256;
    uint256 public nextEpoch;
    uint256 public latestTS;
    uint256 public epochInterval;

    // modifiers
    
    modifier onlyAdmin() {
        require(admin[msg.sender] == true, "Not allowed");
        _;
    }

    // events

    event EpochData(uint256 indexed epoch, uint256 indexed goldPro, uint256 indexed gold, uint256 golddaily, bytes32 avgpricehash, bytes32 datasetGoldProhash, bytes32 datasetGoldhash, uint256 ts);

    // constructor

    constructor(uint256 _goldPro, uint256 _gold, uint256 _goldDaily, bytes32 _epochGoldProDataSetHash, bytes32 _epochGoldDataSetHash, uint256 _epochInterval) {
        admin[msg.sender] = true;
        PriceFeedData[0].goldPro = _goldPro;
        PriceFeedData[0].gold = _gold;
        PriceFeedData[0].goldDaily = _goldDaily;
        PriceFeedData[0].epochAvgPriceHash = keccak256((abi.encodePacked(_goldPro.toString() , _gold.toString())));
        PriceFeedData[0].epochGoldProDataSetHash = _epochGoldProDataSetHash;
        PriceFeedData[0].epochGoldDataSetHash = _epochGoldDataSetHash;
        PriceFeedData[0].epochTS = block.timestamp;
        latestTS = block.timestamp;
        epochInterval = _epochInterval;
        emit EpochData(0, PriceFeedData[0].goldPro, PriceFeedData[0].gold, PriceFeedData[0].goldDaily, PriceFeedData[0].epochAvgPriceHash, PriceFeedData[0].epochGoldProDataSetHash, PriceFeedData[0].epochGoldDataSetHash, PriceFeedData[0].epochTS);
        nextEpoch = nextEpoch + 1;
    }

    // set epoch data

    function setData(uint256 _goldPro, uint256 _gold, uint256 _goldDaily, bytes32 _epochGoldProDataSetHash, bytes32 _epochGoldDataSetHash) public onlyAdmin {
        require (block.timestamp >= latestTS + epochInterval, "1 epoch per interval"); 
        uint256 curEpoch = nextEpoch;
        PriceFeedData[curEpoch].goldPro = _goldPro;
        PriceFeedData[curEpoch].gold = _gold;
        PriceFeedData[curEpoch].goldDaily = _goldDaily;
        PriceFeedData[curEpoch].epochAvgPriceHash = keccak256((abi.encodePacked(_goldPro.toString() , _gold.toString())));
        PriceFeedData[curEpoch].epochGoldProDataSetHash = _epochGoldProDataSetHash;
        PriceFeedData[curEpoch].epochGoldDataSetHash = _epochGoldDataSetHash;
        PriceFeedData[curEpoch].epochTS = block.timestamp;
        latestTS = block.timestamp;
        emit EpochData(curEpoch, PriceFeedData[curEpoch].goldPro, PriceFeedData[curEpoch].gold, PriceFeedData[curEpoch].goldDaily, PriceFeedData[curEpoch].epochAvgPriceHash, PriceFeedData[curEpoch].epochGoldDataSetHash, PriceFeedData[curEpoch].epochGoldDataSetHash, PriceFeedData[curEpoch].epochTS);
        nextEpoch = nextEpoch + 1;
    }

    // retrieve data for latest epoch

    function getLatestPrices() public view returns (uint256, uint256, uint256, uint256, bytes32, uint256) {
        uint256 latest = nextEpoch - 1;
        return (latest, PriceFeedData[latest].goldPro, PriceFeedData[latest].gold, PriceFeedData[latest].goldDaily, PriceFeedData[latest].epochAvgPriceHash, PriceFeedData[latest].epochTS);
    }

    // retrieve data for specific epoch

    function getEpochPrices(uint256 _epoch) public view returns (uint256, uint256, uint256, bytes32, uint256) {
        return (PriceFeedData[_epoch].goldPro, PriceFeedData[_epoch].gold, PriceFeedData[_epoch].goldDaily, PriceFeedData[_epoch].epochAvgPriceHash, PriceFeedData[_epoch].epochTS);
    }

    // retrieve dataset hashes for specific epoch

    function getEpochDataSetHash(uint256 _epoch) public view returns (bytes32, bytes32) {
        return (PriceFeedData[_epoch].epochGoldProDataSetHash, PriceFeedData[_epoch].epochGoldDataSetHash);
    }

    // update admin status

    function updateAdminStatus(address _address, bool _st) public onlyOwner() {
        admin[_address] = _st;
    }

    // update epoch interval

    function updateEpochInterval(uint256 _epochInterval) public onlyOwner() {
        epochInterval = _epochInterval;
    }

}