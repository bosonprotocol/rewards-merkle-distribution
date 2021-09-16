import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract } from "ethers";
import { deploy_token } from "../scripts/deploy-token";
import { deploy } from "../scripts/deploy";

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
let deployer: Signer, account1: Signer, account2: Signer, account3: Signer;
let deployerAddr: string, account1Addr: string, account2Addr: string, account3Addr: string;
let token: Contract;

describe("MerkleDistributor", function () {
  before('', async() => {
    [deployer, account1, account2, account3] = await ethers.getSigners();
    deployerAddr = await deployer.getAddress();
    account1Addr = await account1.getAddress();
    account2Addr = await account2.getAddress();
    account3Addr = await account3.getAddress();

    token = await deploy_token();

  });
  it("Should deploy the merkleDistributor contract", async function () {
    const merkleDistributor = await deploy(token.address, ZERO_BYTES32);
  
    expect(await merkleDistributor.token()).to.equal(token.address);
    expect(await merkleDistributor.merkleRoot()).to.equal(ZERO_BYTES32);
    expect(await merkleDistributor.owner()).to.equal(deployerAddr);
    const unlock = await merkleDistributor.unlock();
    console.log('merkleDistributor.unlock()', unlock.toString());
    expect(unlock.eq(0)).to.be.false;
  
  });
});
