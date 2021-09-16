const { expect } = require("chai");
const { ethers } = require("hardhat");

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const TOKEN_ADDRESS = '0x976EA74026E726554dB657fA54763abd0C3a0aa9';
let deployer, account1, account2, account3;
let deployerAddr, account1Addr, account2Addr, account3Addr;

describe("MerkleDistributor", function () {
  before('', async() => {
    [deployer, account1, account2, account3] = await ethers.getSigners();
    deployerAddr = await deployer.getAddress();
    account1Addr = await account1.getAddress();
    account2Addr = await account2.getAddress();
    account3Addr = await account3.getAddress();
  });
  it("Should deploy the merkleDistributor contract", async function () {
    const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    const merkleDistributor = await MerkleDistributor.deploy(TOKEN_ADDRESS, ZERO_BYTES32);

    await merkleDistributor.deployed();
  
    console.log("MerkleDistributor deployed to:", merkleDistributor.address);

    expect(await merkleDistributor.token()).to.equal(TOKEN_ADDRESS);
    expect(await merkleDistributor.merkleRoot()).to.equal(ZERO_BYTES32);
    expect(await merkleDistributor.owner()).to.equal(deployerAddr);
    const unlock = await merkleDistributor.unlock();
    console.log('merkleDistributor.unlock()', unlock.toString());
    expect(unlock.eq(0)).to.be.false;
  
  });
});
