import fs from 'fs'
import { parseBalanceMap } from '../scripts/parse-balance-map'

const INPUT_FILE='./inputs/test1.json';

console.log('Hello test1');

const json = JSON.parse(fs.readFileSync(INPUT_FILE, { encoding: 'utf8' }));
console.log(json);
if (typeof json !== 'object') throw new Error('Invalid JSON')
console.log(JSON.stringify(parseBalanceMap(json)))
