# GEMNFTs contracts

This repository contains the Solidity smart contracts **GEMMinting** and **GEMNFT**, developed by the IPMB Dev Team, designed to support the creation and management of GEMNFTs. The contracts include features like the creation of GEMNFTs categories, minting and burning. 

## Features

### 1. **Creation of Categories**
- Admins can create various GEMNFT categories with the following parameters:
  - **id**: The id of the GEM NFT category.
  - **Price**: The standard price someone will pay to buy an NFT from that category.
  - **Supply**: The total number of NFTs for that category.
  - **Fee**: An additional fee paid in POL to buy an NFT from the specific category.

### 2. **GEMNFT Minting using a matured staked position**
- A user can mint a GEMNFT by burning it's staking position with the following parameters:
  - **id**: The id of the GEM NFT category.
  - **Receiver**: The address that will receive the NFT.
  - **Pool id**: The pool id of staked tokens.
  - **Epoch**: The epoch when the staking position was matured.
  - **Index**: The index of the staking position.
  - **MerkleProofs**: A set of proofs to verify the merkle root.
 
### 3. **GEMNFT Minting instant buy**
- A user can mint a GEMNFT with an instant buy option with the following parameters:
  - **id**: The id of the GEM NFT category.
  - **Receiver**: The address that will receive the NFT.

### 4. **Integration with Price Feeds**
- Fetches real-time prices for GoldPro and gold from an external price feed contract.

### 5. **Integration with Staking contract**
- Fetches real-time staking positions from the external staking contract.

### 6. **Event Logging**
- Emits events for all major actions to facilitate tracking and debugging.

---

## Deployment

### Prerequisites
1. Solidity version: `^0.8.19`
2. Contracts (e.g., "GEMMinting" & "GEMNFTs")
3. External price feed contract implementing the `IPriceFeed` interface
4. External staking contract implementing the `IStaking` interface

### Steps
1. Deploy the GEMNFTs contract with the following parameters:
   - `name`: The name of the GEMNFT contract.
   - `symbol`: The symbol of the GEMNFT contract.
   - `Staking contract`: The contract address of the Staking contract.
   - `Burn Period`: The duration that needs to pass to be able to burn an NFT.
  
2. Deploy the GEMMinting contract with the following parameters:
   - `Staking contract`: The contract address of the Staking contract.
   - `GPRO address`: The contract address of the GPRO token.
   - `Price Feed`: The contract address of the Price Feed contract.
   - `GEMNFTs`: The contract address of the GEMNFTs contract.

3. On the GEMNFTs contract do the following:
   - Create a GEMNFT category.
   - Set the GEMMintng contract address.
   - Flip the contract state to allow minting.
   
4. For instant-buy minting:
   - Grant an approval from the GPRO token contract to the GEMMinting contract.
   - Execute the `mintSpotBatch` function.
  
5. For staking-position minting:
   - Set the GEMMintng contract address on the Staking Contract.
   - On the Staking contract approve the GEMMinting contract to spend GPRO.
   - On the GEMMintng contract set the epoch Merkle Root.
   - On the GEMMinting contract call the `mintGEMNFT` function.

---

## Documenation

[Visit our gitbook](https://ipmb.gitbook.io/contracts)

---

## Polygon PoS - Amoy Testnet

*GEMNFTs - v2.5:* [0xACac111bBf412f9B41A6F171dF93a824AA4D7706](https://amoy.polygonscan.com/address/0xACac111bBf412f9B41A6F171dF93a824AA4D7706)

*GEMMinting - v1.9:* [0xEb3354f4F22eD16c844Ba4241Bb4e5C781A3e1CA](https://amoy.polygonscan.com/address/0xEb3354f4F22eD16c844Ba4241Bb4e5C781A3e1CA)

For the GPRO, PriceFeed and Staking contracts addresses view the [Staking repo](https://github.com/IpmbOfficial/IPMB-staking-contracts)

---

## Tests

1. Download the github repo
2. Open command prompt and navigate to the [contracts](https://github.com/IpmbOfficial/IPMB-GEM-contracts/tree/main/contracts) folder
3. Install hardhat using `npm i`
4. Compile smart contracts using `npx hardhat compile`
  - If you get `Error HH502` then please upgrade to the laetst hardhat - `npm up hardhat`
5. Run the tests that exist within the test folder using `npx hardhat test`
