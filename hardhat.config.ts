import { task } from "hardhat/config";
import * as dotEnvConfig from "dotenv";
dotEnvConfig.config();

import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { BigNumber } from "@ethersproject/bignumber";
import { Signer } from "@ethersproject/abstract-signer";

if (!process.env.MNEMONIC) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const lazyImport = async (module: any) => {
	return await import(module);
}

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const TOKEN_ADDRESS = '0x976EA74026E726554dB657fA54763abd0C3a0aa9';

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deploy", "Deploy MerkleDistributor contract on a provided network", async (taskArgs, hre) => {
  // TODO: add parameters: tokenAddr + distribution-file and compute the merkle proof
  const { before_deployment, after_deployment } = await lazyImport('./scripts/utils')
  const args = await before_deployment(hre);
  // TODO: compute the merkle_root from the distribution-file
  const merkle_root = ZERO_BYTES32;
  const { deploy } = await lazyImport('./scripts/deploy-merkle')
  await deploy(TOKEN_ADDRESS, merkle_root);
  await after_deployment(args);
});

task("deploy-token", "Deploy Token on a provided network", async (taskArgs, hre) => {
  const { before_deployment, after_deployment } = await lazyImport('./scripts/utils')
  const args = await before_deployment(hre);
  const { deploy_token } = await lazyImport('./scripts/deploy-token')
  await deploy_token(100000000);
  await after_deployment(args);
});

  // You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.6.11",
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    ganache: {
      chainId: 1337,
      url: "http://127.0.0.1:8545",
      accounts: {
          count: 10,
          initialIndex: 0,
          mnemonic: process.env.MNEMONIC,
          path: "m/44'/60'/0'/0",
      },
    },
    rinkeby: {
      chainId: 4,
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: {
          count: 10,
          initialIndex: 0,
          mnemonic: process.env.MNEMONIC,
          path: "m/44'/60'/0'/0",
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
