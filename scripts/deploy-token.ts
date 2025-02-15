// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumberish, Contract } from "ethers";
import * as hre from "hardhat";

const TOKEN_NAME = 'MY_TOKEN';
const TOKEN_SYMBOL = 'TKN';

export async function deploy_token(totalSupply: BigNumberish): Promise<Contract> {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const TestERC20 = await hre.ethers.getContractFactory("TestERC20");
  const testERC20 = await TestERC20.deploy(TOKEN_NAME, TOKEN_SYMBOL, totalSupply);
  const [deployer] = await hre.ethers.getSigners();

  await testERC20.deployed();

  console.log("TestERC20 deployed to:", testERC20.address);
  return testERC20;
}
