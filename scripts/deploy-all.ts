import fs from 'fs'
import { deploy_token } from './deploy-token';
import { parseBalanceMap } from './parse-balance-map'
import * as hre from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { deploy } from './deploy-merkle';
import BalanceTree from './balance-tree';
import { before_deployment, after_deployment } from './utils';

const INPUT_FILE='./inputs/test1.json';
const OUTPUT_FILE=`./outputs/test1-${hre.network.name}.json`;

async function test1() {

  // Read INPUT file and build the merkleTree
  const json = JSON.parse(fs.readFileSync(INPUT_FILE, { encoding: 'utf8' }));
  console.log(json);
  if (typeof json !== 'object') throw new Error('Invalid JSON')
  const merkleTree = parseBalanceMap(json);
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
  const outputData: any = {};
  // Add network.name and chainId in distribution
  outputData.network = {
      name: hre.network.name,
      chainId: hre.network.config.chainId
  };
  // Add token address in distribution
  outputData.tokenAddress = token.address;
  // Add balance_map in distribution
  outputData.balance_map = merkleTree;
  // Add contract address in balance_map
  merkleTree.contractAddress = merkleDistributor.address;
  // write the OUTPUT file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, "\t"));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
test1()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });