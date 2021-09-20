import { BigNumber } from 'ethers';
const decimals = 18;

for (let amount = 100; amount < 1500; amount += 100) {
  const bn = BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals));
  console.log(amount, '-->', bn.toHexString());
}