import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer, Contract, BigNumber, BigNumberish } from "ethers";
import { deploy_token } from "../scripts/deploy-token";
import { deploy } from "../scripts/deploy-merkle";
import { MerkleDistributorInfo, parseBalanceMap } from "../scripts/parse-balance-map";

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
let deployer: Signer, accounts: Signer[];
let deployerAddr: string;
let token: Contract, merkleDistributor: Contract;
let tab_earnings = [
  100, 200, 300, 400, 500, 600, 700, 800
];
let merkleTree: MerkleDistributorInfo;
let to_not_transfer_yet: BigNumberish;

async function claim_process(
  account_index: number,
  expect_success: boolean,
  overrides: {
    expected_exception?: string,
    expected_already_claimed?: boolean,
    wrong_index?: number,
    wrong_account?: string,
    wrong_amount?: string,
    wrong_proof?: string[]
  }
  ) {
  const signer = accounts[account_index];
  const account = await signer.getAddress();
  const claim = merkleTree.claims[account];
  const balance_before = await token.balanceOf(account);
  const contract_balance_before = await token.balanceOf(merkleDistributor.address);
  if (expect_success) {
    expect(await merkleDistributor.isClaimed(claim.index)).to.be.false;
    await merkleDistributor.connect(signer).claim(claim.index, account, claim.amount, claim.proof);
    expect(await merkleDistributor.isClaimed(claim.index)).to.be.true;
    const balance_after = await token.balanceOf(account);
    expect(balance_after.sub(balance_before).eq(claim.amount)).to.be.true;
    const contract_balance_after = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_before.sub(contract_balance_after).eq(claim.amount)).to.be.true;
  } else {
    expect(await merkleDistributor.isClaimed(claim.index)).to.equal(overrides.expected_already_claimed);
    await expect(merkleDistributor.connect(signer).claim(
      overrides.wrong_index ? overrides.wrong_index : claim.index,
      overrides.wrong_account ? overrides.wrong_account : account,
      overrides.wrong_amount ? overrides.wrong_amount : claim.amount,
      overrides.wrong_proof ? overrides.wrong_proof : claim.proof
      ))
    .to.be.revertedWith(overrides.expected_exception as string);
    const balance_after = await token.balanceOf(account);
    expect(balance_after.eq(balance_before)).to.be.true;
    const contract_balance_after = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_before.eq(contract_balance_after)).to.be.true;
  }
}

describe("MerkleDistributor", function () {
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
    merkleDistributor = await deploy(token.address, merkleTree.merkleRoot);
  
    expect(await merkleDistributor.token()).to.equal(token.address);
    expect(await merkleDistributor.merkleRoot()).to.equal(merkleTree.merkleRoot);
    expect(await merkleDistributor.owner()).to.equal(deployerAddr);
    const unlock = await merkleDistributor.unlock();
    expect(unlock.eq(0)).to.be.false;
  
  });
  it('Should transfer tokens to the distributor contract', async function () {
    const contract_balance_before = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_before.eq(0)).to.be.true;
    // do not transfer everything now
    to_not_transfer_yet = merkleTree.claims[await accounts[8].getAddress()].amount;
    const to_be_transfered = BigNumber.from(merkleTree.tokenTotal).sub(to_not_transfer_yet);
    await token.connect(deployer).transfer(merkleDistributor.address, to_be_transfered);
    const contract_balance_after = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_after.eq(to_be_transfered)).to.be.true;

  });
  it('Claim from the 1st account', async function () {
    await claim_process(1, true, {});
  });
  it('Claim from an already claimed account', async function () {
    await claim_process(1, false, { expected_exception: 'MerkleDistributor: Drop already claimed.', expected_already_claimed: true});
  });
  it('Claim from a not listed account', async function () {
    const signer = accounts[accounts.length - 1];
    const wrong_account = await signer.getAddress();
    await claim_process(
      2, // Choose a valid claim of another account
      false,
      {
        expected_exception: 'MerkleDistributor: Invalid proof.',
        expected_already_claimed: false,
        wrong_account: wrong_account
      }
    )
  });
  it('Claim from a listed account for another amount', async function () {
    const wrong_claim = merkleTree.claims[await accounts[3].getAddress()];
    await claim_process(
      2,
      false,
      {
        expected_exception: 'MerkleDistributor: Invalid proof.',
        expected_already_claimed: false,
        wrong_amount: wrong_claim.amount
      }
    )
  });
  it('Claim from a listed account for another index', async function () {
    const wrong_claim = merkleTree.claims[await accounts[3].getAddress()];
    await claim_process(
      2,
      false,
      {
        expected_exception: 'MerkleDistributor: Invalid proof.',
        expected_already_claimed: false,
        wrong_index: wrong_claim.index
      }
    )
  });
  it('Claim from a listed account with another proof', async function () {
    const wrong_claim = merkleTree.claims[await accounts[3].getAddress()];
    await claim_process(
      2,
      false,
      {
        expected_exception: 'MerkleDistributor: Invalid proof.',
        expected_already_claimed: false,
        wrong_proof: wrong_claim.proof
      }
    )
  });
  it('Claim for accounts from 2 to 7', async function () {
    for (let i = 2; i < 8; i++) {
      await claim_process(i, true, {});
    }
  });
  it('The last account can not claim because the contract balance is empty', async function () {
    const contract_balance_before = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_before.eq(0)).to.be.true;
    await claim_process(
      8,
      false,
      {
        expected_exception: 'ERC20: transfer amount exceeds balance',
        expected_already_claimed: false,
      }
    )
  });
  it('After transfering the missing tokens to the contract the last account can now claim', async function () {
    let contract_balance_before = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_before.eq(0)).to.be.true;
    await token.connect(deployer).transfer(merkleDistributor.address, to_not_transfer_yet);
    contract_balance_before = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_before.eq(to_not_transfer_yet)).to.be.true;
    await claim_process(8, true, {});
    const contract_balance_after = await token.balanceOf(merkleDistributor.address);
    expect(contract_balance_after.eq(0)).to.be.true;
  })
});
