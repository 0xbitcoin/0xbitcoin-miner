
var Web3 = require('web3-eth')
const Miner = require("./0xbitcoinminer");


var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var SMARTCONTRACT_ADDRESS ='0x9ec7567938f19d08d1915c2ab7ed23c743e49e31'

var web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ROPSTEN_URL));

var tokenContract = require('./_0xBitcoinToken.json');

if (process.argv.length <= 2) {
console. log("Please add a difficulty parameter (1-64)");
process. exit(-1);
}

var account_address =  process.argv[2] ;


var contract = new web3.Contract(tokenContract.abi, SMARTCONTRACT_ADDRESS, {
   from: account_address, // default from address
   gasPrice: '2000000000' // default gas price in wei, 2 gwei in this case
});

Miner.init( web3 , contract, account_address )
