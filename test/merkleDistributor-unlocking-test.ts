import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract, BigNumber, BigNumberish } from "ethers";
import { deploy_token } from "../scripts/deploy-token";
import { MerkleDistributorInfo, parseBalanceMap } from "../scripts/parse-balance-map";
import { deploy } from "../scripts/deploy-merkle";

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
let deployer: Signer, accounts: Signer[];
let deployerAddr: string;
let token: Contract, merkleDistributor: Contract;
let tab_earnings = [
  100, 200, 300, 400, 500, 600, 700, 800
];
let merkleTree: MerkleDistributorInfo;

async function increaseNextBlockTimestamp(period_sec: number) {
  await ethers.provider.send("evm_increaseTime", [period_sec])
  await ethers.provider.send("evm_mine", [])

}


describe('Merkle-Distributor Unlocking test', async function () {
  before('', async() => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    deployerAddr = await deployer.getAddress();
  });
  it('Should build the merkle tree', async function () {
    const balance_map = [];
    let total_earnings = BigNumber.from(0);
    for (let i = 0; i < tab_earnings.length; i++) {
      const address = await accounts[i+1].getAddress();
      const earnings = BigNumber.from(tab_earnings[i]);
      balance_map.push({
        address,
        earnings: earnings.toHexString(),
        // reasons: ''
      });
      total_earnings = total_earnings.add(earnings);
    }
    merkleTree = parseBalanceMap(balance_map);
    const token_total = BigNumber.from(merkleTree.tokenTotal);
    expect(token_total.eq(total_earnings)).to.be.true;
    expect(merkleTree.merkleRoot).to.not.equal(ZERO_BYTES32);
  });
  it('Should build and deploy the token contract', async function () {
    token = await deploy_token(merkleTree.tokenTotal);

    const deployer_balance = await token.balanceOf(await deployer.getAddress());
    expect(deployer_balance.eq(merkleTree.tokenTotal)).to.be.true;
  })
  it("Should deploy the merkleDistributor contract", async function () {
    const claimingPeriod = 5;
    merkleDistributor = await deploy(token.address, merkleTree.merkleRoot);
  
    expect(await merkleDistributor.token()).to.equal(token.address);
    expect(await merkleDistributor.merkleRoot()).to.equal(merkleTree.merkleRoot);
    expect(await merkleDistributor.owner()).to.equal(deployerAddr);
  });
  it('Should transfer tokens to the distributor contract', async function () {
    const contract_balance_before = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_before.eq(0)).to.be.true;
    const to_be_transfered = merkleTree.tokenTotal;
    await token.connect(deployer).transfer(merkleDistributor.address, to_be_transfered);
    const contract_balance_after = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_after.eq(to_be_transfered)).to.be.true;
  });
  it('Check the fold is not allowed yet', async function () {
    const unlock = await merkleDistributor.unlock();
    const blockNumber = await ethers.provider.getBlockNumber();
    const currentBlock = await ethers.provider.getBlock(blockNumber);
    expect(BigNumber.from(currentBlock.timestamp).lt(unlock)).to.be.true;
    await expect(merkleDistributor.connect(deployer).fold())
    .to.be.revertedWith('MerkleDistributor: Claim period has not passed.');
  })
  it('Check the fold is not allowed after 179 days', async function () {
    await increaseNextBlockTimestamp(3600*24*179);
    const unlock = await merkleDistributor.unlock();
    const blockNumber = await ethers.provider.getBlockNumber();
    const currentBlock = await ethers.provider.getBlock(blockNumber);
    expect(BigNumber.from(currentBlock.timestamp).lt(unlock)).to.be.true;
    await expect(merkleDistributor.connect(deployer).fold())
    .to.be.revertedWith('MerkleDistributor: Claim period has not passed.');
  })
  it('Increase the next block timestamp by 1 day more (so 180 days in total)', async function () {
    await increaseNextBlockTimestamp(3600*24*1);
    const unlock = await merkleDistributor.unlock();
    const blockNumber = await ethers.provider.getBlockNumber();
    const currentBlock = await ethers.provider.getBlock(blockNumber);
    expect(BigNumber.from(currentBlock.timestamp).gt(unlock)).to.be.true;
  })
  it('Check the fold is allowed and funds are transferred back to the contract owner', async function () {
    const balance_owner_before = await token.balanceOf(deployerAddr);
    const contract_balance_before = await token.balanceOf(merkleDistributor.address);
    expect(balance_owner_before.eq(0)).to.be.true;
    expect(contract_balance_before.gt(0)).to.be.true;
    await merkleDistributor.connect(deployer).fold();
    const contract_balance_after = await token.balanceOf(merkleDistributor.address);
    const balance_owner_after = await token.balanceOf(deployerAddr);
    expect(balance_owner_after.eq(contract_balance_before)).to.be.true;
  })
});

