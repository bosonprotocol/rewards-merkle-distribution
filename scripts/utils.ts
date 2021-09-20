import { BigNumber, Signer } from "ethers";

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
