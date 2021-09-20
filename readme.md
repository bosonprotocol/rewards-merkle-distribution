# Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npm run deploy
npm run deploy:rinkeby
npm run deploy:ganache
npm run deploy-all
npx hardhat deploy-token
npx eslint . --ext .ts
npx eslint . --ext .ts --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
npm run deploy-all -- --network rinkeby
```

Then, copy and paste the commands printed in the console log "Please call 'npx hardhat verify --network ...'" for both the token contract and the merkle-distributor one

Examples:

```shell
npx hardhat verify --network rinkeby 0xfac859908c6d4373c799E30846Dde0CbE8F7bdCc MY_TOKEN TKN 0x0124bc0ddd92e5600000
```

```shell
npx hardhat verify --network rinkeby 0x6ff9785061F8752A67F8FdCAB24e36C462b604B9 0xfac859908c6d4373c799E30846Dde0CbE8F7bdCc 0x6e2b0555d30fdbaa2042299307fecc086f8a09a047264c0f72b2c674fcb13ff4
```
