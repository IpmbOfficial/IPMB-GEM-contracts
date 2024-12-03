const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai")
const { ethers } = require("hardhat")
const fixturesDeployment = require("../scripts/fixturesDeployment.js")

let signers
let contracts

describe("Staking tests", function () {
  before(async function () {
    ;({ signers, contracts } = await loadFixture(fixturesDeployment))
  })

  context("Verify Fixture", () => {
    it("Contracts are deployed", async function () {
      expect(await contracts.hhPriceFeed.getAddress()).to.not.equal(
        ethers.ZeroAddress,
      )
      expect(await contracts.hhGoldPro.getAddress()).to.not.equal(
        ethers.ZeroAddress,
      )
      expect(await contracts.hhGPROStaking.getAddress()).to.not.equal(
        ethers.ZeroAddress,
      )
    })
  })

  context("Register Pool", () => {
    
    // register a pool
    it("#registerPool", async function () {
      await contracts.hhGPROStaking.registerPool(
        "Gem1-3M-2%", // _poolName
        600, // _duration
        2,// _discount
        BigInt(1000000000000000000), // _amount 1 GPRO
        300, // _lockDuration
        5, // _poolMax
      )
    })

    // check the status of a ppol
    it("#checkPoolStatus", async function () {
      const status = await contracts.hhGPROStaking.poolStatus(
        1
      )
      expect(status).equal(true); 
    })
    
  }) // end of register context

  context("Add KYC, Approve and Deposit", () => {

    // add Address to KYC
    it("#addKYC", async function () {
      await contracts.hhGPROStaking.updateKYCAddress(
        signers.owner.address,
        true
      )
    })

    // approve tokens
    it("#approveTokens", async function () {
      await contracts.hhGoldPro.approve(
        contracts.hhGPROStaking,
        BigInt(100000000000000000000) // 100 GPRO
      )
    })

    // deposit to pool
    it("#depositPool", async function () {
      await contracts.hhGPROStaking.depositPool(
        1
      )
    })
    
  }) // end of deposit context

  context("Check Deposit", () => {

    it("#poolAmount", async function () {
      const amount = await contracts.hhGPROStaking.poolAmountPerAddress(
        1, // _poolId
        signers.owner.address, // _address
        0 // _index
      )
      expect(amount).equal(BigInt(1000000000000000000)); //
    })
    
  }) // end check deposit

  context("Check Lockdown Period", () => {

    it("#lockDown", async function () {
      expect(contracts.hhGPROStaking.withdrawalPool(
        1, // _poolId
        0 // _index
      )).to.be.revertedWith("Time has not passed"); //
    })
    
  }) // end lockdown check

  context("Check Discount", () => {

    it("#discount", async function () {
      await time.increase(605);
      expect(await contracts.hhGPROStaking.getDiscount(
        1, // _poolId
        signers.owner.address, // _address
        0, // _index
      )).to.equal(2);
    })
    
  }) // end check discount

  context("Deposits and Withdrawal", () => {

    it("#depositPool", async function () {
      await contracts.hhGPROStaking.depositPool(
        1
      )
    })

    it("#depositPool", async function () {
      await contracts.hhGPROStaking.depositPool(
        1
      )
    })

    it("#poolAmount", async function () {
      const amount = await contracts.hhGPROStaking.poolAmountPerAddress(
        1, // _poolId
        signers.owner.address, // _address
        1 // _index
      )
      expect(amount).equal(BigInt(1000000000000000000)); //
    })

    it("#withdrawalPool", async function () {
      await time.increase(310);
      await contracts.hhGPROStaking.withdrawalPool(
        1, // _poolId
        1, // _index
      )
    })
    
  }) // end deposits and withdrawl

  context("Check Blacklist", () => {

    it("#blackListWallet", async function () {
      await contracts.hhGPROStaking.addBlacklist(
        signers.owner.address, // _address
        1, // _status
      )
    })

    it("#depositBlocked", async function () {
      expect(contracts.hhGPROStaking.depositPool(
        1, // _poolId
      )).to.be.revertedWith("Address is blacklisted"); //
    })

    it("#withdrawalBlocked", async function () {
      expect(contracts.hhGPROStaking.withdrawalPool(
        1, // _poolId
        0 // _index
      )).to.be.revertedWith("Address is blacklisted"); //
    })
    
  }) // end blacklist check

  context("Blacklist Withdrawal", () => {

    it("#blacklistAddressWithdrawalPool", async function () {
      await time.increase(610);
      await contracts.hhGPROStaking.blacklistAddressWithdrawalPool(
        signers.addr1.address, // _receiver
        signers.owner.address, // _address
        1, // _poolID
        0, // _index
      )
    })

    it("#blacklistAddressWithdrawalPool", async function () {
      await time.increase(610);
      await contracts.hhGPROStaking.blacklistAddressWithdrawalPool(
        signers.addr1.address, // _receiver
        signers.owner.address, // _address
        1, // _poolID
        2, // _index
      )
    })

    it("#receiverBalance", async function () {
      const balance = await contracts.hhGoldPro.balanceOf(signers.addr1.address)
      expect(balance).to.equal(BigInt(2000000000000000000)); // if other fails
    })

  }) // end blacklist check

  context("Transfer Tokens and Add KYC to Address 2", () => {

    it("#transferTokens", async function () {
      await contracts.hhGoldPro.transfer(
        signers.addr2.address, // _receiver
        BigInt(10000000000000000000), // _amount
      )
    })

    it("#receiverBalance", async function () {
      const balance = await contracts.hhGoldPro.balanceOf(signers.addr2.address)
      expect(balance).to.equal(BigInt(10000000000000000000)); // if other fails
    })

    // approve tokens
    it("#approveTokens", async function () {
      await contracts.hhGoldPro.connect(signers.addr2).approve(
        contracts.hhGPROStaking,
        BigInt(100000000000000000000) // 100 GPRO
      )
    })

    it("#addKYC", async function () {
      await contracts.hhGPROStaking.updateKYCAddress(
        signers.addr2.address,
        true
      )
    })

  }) // end transfer

  context("Change Epoch", () => {

    it("#checkData of epoch 0", async function () {
      const [, gpro, gold, golddaily, ,] = await contracts.hhPriceFeed.getLatestPrices()
      expect(gpro).to.equal("80"); // if other fails
      expect(gold).to.equal("80"); // if other fails
      expect(golddaily).to.equal("100"); // if other fails
    })

    it("#addEpoch", async function () {
      await time.increase(110);
      await contracts.hhPriceFeed.setData(
        100, // _goldPro
        100, // _gold
        120, // _goldDaily
        "0xe2f2af72d4dc39d12179077867ef9d726b5b8430acd5357fa00503c0e56bd69f", // _epochGoldProDataSetHash
        "0x070b4e17a7a1f2158be12744e9f839c622931c6df32aa8342a66f7710e4a1c14", // _epochGoldDataSetHash
      )
    })

    it("#checkData of epoch 1", async function () {
      const [gpro, gold, golddaily, ,] = await contracts.hhPriceFeed.getEpochPrices(
        1 // _epoch
      )
      expect(gpro).to.equal("100"); // if other fails
      expect(gold).to.equal("100"); // if other fails
      expect(golddaily).to.equal("120"); // if other fails
    })

  }) // end new epoch

  context("Check Dataset Hashes", () => {

    it("#checkHashes 0 epoch", async function () {
      const [gpro, gold] = await contracts.hhPriceFeed.getEpochDataSetHash(
        0 // _epoch
      )
      expect(gpro).to.equal("0x4df817a31b2b68719ac77978bef933d23d0daeacaba2e1d7d501635ef3f32580"); // if other fails
      expect(gold).to.equal("0x37be355583a126f6df64b523391a3adae33d27c6323930461f04b72db0700c2b"); // if other fails
    })

    it("#checkHashes 1 epoch", async function () {
      const [gpro, gold] = await contracts.hhPriceFeed.getEpochDataSetHash(
        1 // _epoch
      )
      expect(gpro).to.equal("0xe2f2af72d4dc39d12179077867ef9d726b5b8430acd5357fa00503c0e56bd69f"); // if other fails
      expect(gold).to.equal("0x070b4e17a7a1f2158be12744e9f839c622931c6df32aa8342a66f7710e4a1c14"); // if other fails
    })

  }) // check dataset hash

  context("Deposit As Address 2", () => {

    // deposit to pool
    it("#depositPool", async function () {
      await contracts.hhGPROStaking.connect(signers.addr2).depositPool(
        1
      )
    })

    it("#checkDepositEpoch", async function () {
      const epoch = await contracts.hhGPROStaking.poolEpochPerAddress(
        1, // _poolID
        signers.addr2.address, // _address
        0, // _index
      )
      expect(epoch).to.equal(1); // if other fails
    })

  }) // end deposit

  context("Discount For Address 2", () => {

    it("#discount", async function () {
      await time.increase(605);
      expect(await contracts.hhGPROStaking.getDiscount(
        1, // _poolId
        signers.addr2.address, // _address
        0, // _index
      )).to.equal(2);
    })

  }) // end check discount

  context("Add New Pool", () => {

    // register a pool
    it("#registerPool", async function () {
      await contracts.hhGPROStaking.registerPool(
        "Gem2.5-12M-11%", // _poolName
        1200, // _duration
        11,// _discount
        BigInt(2500000000000000000), // _amount 1 GPRO
        600, // _lockDuration
        4, // _poolMax
      )
    })

  }) // end register pool

  context("Deposit as Address 2 and Check", () => {

    // deposit to pool
    it("#depositPool", async function () {
      await contracts.hhGPROStaking.connect(signers.addr2).depositPool(
        2
      )
    })

    it("#checkDepositEpoch", async function () {
      const epoch = await contracts.hhGPROStaking.poolAmountPerAddress(
        2, // _poolID
        signers.addr2.address, // _address
        0, // _index
      )
      expect(epoch).to.equal(BigInt(2500000000000000000)); // if other fails
    })

  }) // end deposit

  context("Discount For Address 2 for Pool 2", () => {

    it("#discount", async function () {
      await time.increase(1250);
      expect(await contracts.hhGPROStaking.getDiscount(
        2, // _poolId
        signers.addr2.address, // _address
        0, // _index
      )).to.equal(11);
    })

  }) // end check discount

  context("Check Pool Max as Address 2", () => {

    // deposit to pool
    it("#depositPool", async function () {
      await contracts.hhGPROStaking.connect(signers.addr2).depositPool(
        2
      )
    })

    // reverted as pool max reached
    it("#poolMaxdeposit", async function () {
      expect(contracts.hhGPROStaking.connect(signers.addr2).depositPool(
        2
      )).to.be.revertedWith("Already deposited max times");
    })
  
  }) // end pool max

  context("Withdrawal as Address 2 and reDeposit", () => {

    it("#withdrawalPool", async function () {
      await time.increase(610);
      await contracts.hhGPROStaking.connect(signers.addr2).withdrawalPool(
        2, // _poolId
        1, // _index
      )
    })

    // deposit to pool
    it("#depositPool", async function () {
      await contracts.hhGPROStaking.connect(signers.addr2).depositPool(
        2
      )
    })

    it("#checkDepositEpoch", async function () {
      const epoch = await contracts.hhGPROStaking.poolAmountPerAddress(
        2, // _poolID
        signers.addr2.address, // _address
        2, // _index
      )
      expect(epoch).to.equal(BigInt(2500000000000000000)); // if other fails
    })

  }) // end withdrawal and deposit

  context("Discount For Address 2 for Pool 2 for new deposit", () => {

    it("#discount", async function () {
      await time.increase(1250);
      expect(await contracts.hhGPROStaking.getDiscount(
        2, // _poolId
        signers.addr2.address, // _address
        2, // _index
      )).to.equal(11);
    })

  }) // end check discount

  context("Full Test as Address 3", () => {

    // transfer tokens to address 3
    it("#transferTokens", async function () {
      await contracts.hhGoldPro.transfer(
        signers.addr3.address, // _receiver
        BigInt(10000000000000000000), // _amount
      )
    })

    // add Address 3 to KYC
    it("#addKYC", async function () {
      await contracts.hhGPROStaking.updateKYCAddress(
        signers.addr3.address,
        true
      )
    })

    // approve tokens as address 3
    it("#approveTokens", async function () {
      await contracts.hhGoldPro.connect(signers.addr3).approve(
        contracts.hhGPROStaking,
        BigInt(10000000000000000000) // 10 GPRO
      )
    })

    // deposit to pool 1 as address 3
    it("#depositPool", async function () {
      await contracts.hhGPROStaking.connect(signers.addr3).depositPool(
        1
      )
    })

    // blacklist address 3
    it("#blackListWallet", async function () {
      await contracts.hhGPROStaking.addBlacklist(
        signers.addr3.address, // _address
        1, // _status
      )
    })

    // withdrawal pool
    it("#withdrawalPool", async function () {
      await time.increase(310);
      expect(contracts.hhGPROStaking.withdrawalPool(
        1, // _poolId
        0, // _index
      )).to.be.revertedWith("Address is blacklisted");
    })

    // deposit blocked due to blacklist
    it("#depositBlockedBlacklist", async function () {
      expect(contracts.hhGPROStaking.connect(signers.addr3).depositPool(
        1, // _poolId
      )).to.be.revertedWith("Address is blacklisted"); //
    })

    // remove from blacklist address 3
    it("#blackListWallet", async function () {
      await contracts.hhGPROStaking.addBlacklist(
        signers.addr3.address, // _address
        0, // _status
      )
    })

    // remove KYC status of Address 3
    it("#removeKYC", async function () {
      await contracts.hhGPROStaking.updateKYCAddress(
        signers.addr3.address,
        false
      )
    })

    // deposit blocked due to KYC
    it("#depositBlockedKYC", async function () {
      expect(contracts.hhGPROStaking.connect(signers.addr3).depositPool(
        1, // _poolId
      )).to.be.revertedWith("No KYC"); //
    })

    // add Address 3 to KYC
    it("#addKYC", async function () {
      await contracts.hhGPROStaking.updateKYCAddress(
        signers.addr3.address,
        true
      )
    })

    // deposit to pool 1 as address 3 (2nd deposit)
    it("#depositPool", async function () {
      await contracts.hhGPROStaking.connect(signers.addr3).depositPool(
        1
      )
    })

    // deposit to pool 2 as address 3 (1st deposit)
    it("#depositPool", async function () {
      await contracts.hhGPROStaking.connect(signers.addr3).depositPool(
        2
      )
    })

    // withdrawal 1st deposit
    it("#withdrawalPool", async function () {
      await time.increase(610);
      await contracts.hhGPROStaking.connect(signers.addr3).withdrawalPool(
        1, // _poolId
        0, // _index
      )
    })

    // check discount of 1st deposit (pool 1) --> 0% as it was withdrew
    it("#discount", async function () {
      await time.increase(1250);
      expect(await contracts.hhGPROStaking.getDiscount(
        1, // _poolId
        signers.addr3.address, // _address
        0, // _index
      )).to.equal(0);
    })

    // check discount of 2nd deposit (pool 1) --> 2%
    it("#discount", async function () {
      await time.increase(1250);
      expect(await contracts.hhGPROStaking.getDiscount(
        1, // _poolId
        signers.addr3.address, // _address
        1, // _index
      )).to.equal(2);
    })

    // check discount of 1st deposit (pool 2) --> 2%
    it("#discount", async function () {
      await time.increase(1250);
      expect(await contracts.hhGPROStaking.getDiscount(
        2, // _poolId
        signers.addr3.address, // _address
        0, // _index
      )).to.equal(11);
    })

  }) // end full test

  context("Check Multi Deposits", () => {

    // remove blacklist
    it("#blackListWallet", async function () {
      await contracts.hhGPROStaking.addBlacklist(
        signers.owner.address, // _address
        0, // _status
      )
    })

    // multi deposits
    it("#multiDepositPool", async function () {
      await contracts.hhGPROStaking.multiDepositPool(
        [1,2], // _poolIDs
        [1,4], // _quantity
      )
    })

    it("#withdrawalPool", async function () {
      await time.increase(600);
      await contracts.hhGPROStaking.withdrawalPool(
        2, // _poolId
        3, // _index
      )
    })

    // single deposit
    it("#singleDeposit", async function () {
      await contracts.hhGPROStaking.depositPool(
        2, // _poolID
      )
    })

    it("#poolAmount", async function () {
      const amount = await contracts.hhGPROStaking.poolAmountPerAddress(
        2, // _poolId
        signers.owner.address, // _address
        4 // _index
      )
      expect(amount).equal(BigInt(2500000000000000000)); //
    })


  }) // end multi deposit test

})