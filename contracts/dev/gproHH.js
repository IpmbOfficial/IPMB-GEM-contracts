const { MerkleTree } = require('merkletreejs');
const { keccak256 } = require("@ethersproject/keccak256");
const { hexConcat } = require('@ethersproject/bytes');

// wallet addresses
const allowList = [
  'f39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  'f39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
];

// epoch

const epoch = [
  '0000000000000000000000000000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000000000000000000000000000',
];

// pool

const pool = [
  '0000000000000000000000000000000000000000000000000000000000000001',
  '0000000000000000000000000000000000000000000000000000000000000001',
];

// count

const count = [
  '0000000000000000000000000000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000000000000000000000000003',
];

let leaves = allowList.map((addr, index) => {
  const concatenatedData = addr + epoch[index] + pool[index] + count[index];
  console.log(concatenatedData);
  const bufferData = Buffer.from(concatenatedData , 'hex');
  return keccak256(keccak256(bufferData));
});


console.log(leaves);

const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });


// Construct Merkle Tree
console.log(merkleTree.toString());

// Generate Merkle root hash
// Get the Merkle root hash, save this to the contract
const merkleRoot = merkleTree.getHexRoot();
console.log(`merkleRoot is:\n ${merkleRoot} \n`);