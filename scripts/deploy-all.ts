import fs from 'fs'
import { deploy_token } from './deploy-token';
import { parseBalanceMap } from './parse-balance-map'
import * as hre from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import { deploy } from './deploy-merkle';
import BalanceTree from './balance-tree';

const INPUT_FILE='./inputs/test1.json';
// TODO rename outputfile in relation with the network/chainId
const OUTPUT_FILE=`./outputs/test1-${hre.network.name}.json`;

function getBalanceAsNumber(bn: BigNumber, decimals: number, accuracy: number) {
    const r1 = BigNumber.from(10).pow(decimals - accuracy);
    const r2 = bn.div(r1);
    const r3 = r2.toNumber();
    const r4 = r3 / (10 ** accuracy);
    return r4;
}
async function before_deployment(hre: any): Promise<{deployer: Signer, balance_before: BigNumber}> {
    const [deployer] = await hre.ethers.getSigners();
    const network_config = (({ accounts, ...o }) => o)(hre.network.config) // remove accounts before logging (to not reveal mnemonic)
    console.log('Network', hre.network.name, network_config);
    const balance_before = await deployer.getBalance();
    console.log('Deployer address', await deployer.getAddress(), 'ETH Balance', getBalanceAsNumber(balance_before, 18, 4));
    return {deployer, balance_before};
}

async function after_deployment(args: {deployer: Signer, balance_before: BigNumber}) {
    const balance_after = await args.deployer.getBalance();
    console.log('Paid fees', getBalanceAsNumber(args.balance_before.sub(balance_after), 18, 4), 'new balance', getBalanceAsNumber(balance_after, 18, 4));
}

    

async function test1() {

    console.log('Hello test1');

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

    // deploy the distriibution contract
    const merkleDistributor = await deploy(token.address, merkleTree.merkleRoot);
    if ((hre.network.name === 'rinkeby') || (hre.network.name === 'mainnet')) {
        console.log(`Please call 'npx hardhat verify --network ${hre.network.name} ${merkleDistributor.address} ${token.address} ${merkleTree.merkleRoot}'`);
    }

    await after_deployment(args);

    // transfer tokens to the distribution contract
    await token.transfer(merkleDistributor.address, merkleTree.tokenTotal);

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