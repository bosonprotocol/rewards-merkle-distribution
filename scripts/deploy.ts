// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import * as hre from "hardhat";
import { Contract } from "ethers";

export async function deploy(token_address: string, merkle_root: string): Promise<Contract> {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const MerkleDistributor = await hre.ethers.getContractFactory("MerkleDistributor");
  const merkleDistributor = await MerkleDistributor.deploy(token_address, merkle_root);

  await merkleDistributor.deployed();

  console.log("MerkleDistributor deployed to:", merkleDistributor.address);

  return merkleDistributor;
}

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// deploy()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

