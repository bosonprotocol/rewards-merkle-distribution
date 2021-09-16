// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import * as hre from "hardhat";

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const TOKEN_ADDRESS = '0x976EA74026E726554dB657fA54763abd0C3a0aa9';

export async function deploy() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const MerkleDistributor = await hre.ethers.getContractFactory("MerkleDistributor");
  const merkleDistributor = await MerkleDistributor.deploy(TOKEN_ADDRESS, ZERO_BYTES32);
  const [deployer] = await hre.ethers.getSigners();

  console.log('network', hre.network.name, hre.network.config);
  console.log('deployer', await deployer.getAddress());

  await merkleDistributor.deployed();

  console.log("MerkleDistributor deployed to:", merkleDistributor.address);
}

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// deploy()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

