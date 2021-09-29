import fs from 'fs'
import fetch from 'node-fetch';
import { BigNumber, Contract, Signer } from "ethers";
import { MerkleDistributorInfo, parseBalanceMap } from "./parse-balance-map";

export function getBalanceAsNumber(bn: BigNumber, decimals: number, accuracy: number) {
  const r1 = BigNumber.from(10).pow(decimals - accuracy);
  const r2 = bn.div(r1);
  const r3 = r2.toNumber();
  const r4 = r3 / (10 ** accuracy);
  return r4;
}

export async function before_deployment(hre: any): Promise<{deployer: Signer, balance_before: BigNumber}> {
  const [deployer] = await hre.ethers.getSigners();
  const network_config = (({ accounts, ...o }) => o)(hre.network.config) // remove accounts before logging (to not reveal mnemonic)
  console.log('Network', hre.network.name, network_config);
  const balance_before = await deployer.getBalance();
  console.log('Deployer address', await deployer.getAddress(), 'ETH Balance', getBalanceAsNumber(balance_before, 18, 4));
  return {deployer, balance_before};
}

export async function after_deployment(args: {deployer: Signer, balance_before: BigNumber}) {
  const balance_after = await args.deployer.getBalance();
  console.log('Paid fees', getBalanceAsNumber(args.balance_before.sub(balance_after), 18, 4), 'new balance', getBalanceAsNumber(balance_after, 18, 4));
}

export async function buildMerkleTreeFromFile(filePath: string): Promise<MerkleDistributorInfo> {
  let json = {};
  if (filePath.startsWith('http')) {
    json = await fetch(filePath)
      .then(res => res.json());
  } else {
    json = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
  }
  // console.log(json);
  if (typeof json !== 'object') throw new Error('Invalid JSON')
  return parseBalanceMap(json);
}

export function buildOutputFile(hre: any, merkleTree: MerkleDistributorInfo, token: Contract, merkleDistributor: Contract, inputFile: string, outputFilePath: string) {
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
  // Add inputFilePath in distribution
  outputData.inputFile = inputFile;
  // Add contract address in balance_map
  merkleTree.contractAddress = merkleDistributor.address;
  // write the OUTPUT file
  fs.writeFileSync(outputFilePath, JSON.stringify(outputData, null, "\t"));
}