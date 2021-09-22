import fs from 'fs'
import { deploy_token } from './deploy-token';
import { parseBalanceMap } from './parse-balance-map'
import * as hre from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { deploy } from './deploy-merkle';
import BalanceTree from './balance-tree';
import { before_deployment, after_deployment, buildMerkleTreeFromFile, buildOutputFile } from './utils';

const INPUT_FILE='./inputs/test1.json';
const OUTPUT_FILE=`./outputs/test1-${hre.network.name}.json`;

async function test1() {

  // Read INPUT file and build the merkleTree
  const merkleTree = await buildMerkleTreeFromFile(INPUT_FILE);
  console.log(JSON.stringify(merkleTree, null, "\t"))

  const args = await before_deployment(hre);

  // deploy the token contract
  const token = await deploy_token(merkleTree.tokenTotal);
  if ((hre.network.name === 'rinkeby') || (hre.network.name === 'mainnet')) {
      console.log(`Please call 'npx hardhat verify --network ${hre.network.name} ${token.address} MY_TOKEN TKN ${merkleTree.tokenTotal}'`);
  }

  // deploy the merkle-distribution contract
  const merkleDistributor = await deploy(token.address, merkleTree.merkleRoot);
  if ((hre.network.name === 'rinkeby') || (hre.network.name === 'mainnet')) {
      console.log(`Please call 'npx hardhat verify --network ${hre.network.name} ${merkleDistributor.address} ${token.address} ${merkleTree.merkleRoot}'`);
  }

  await after_deployment(args);

  // transfer tokens to the merkle-distribution contract
  await token.transfer(merkleDistributor.address, merkleTree.tokenTotal);

  // build the OUTPUT file
  buildOutputFile(hre, merkleTree, token, merkleDistributor, INPUT_FILE, OUTPUT_FILE);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
test1()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });