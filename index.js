var Web3 = require('web3')
const Miner = require("./0xbitcoinminer");


var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var SMARTCONTRACT_ADDRESS ='0x9ec7567938f19d08d1915c2ab7ed23c743e49e31'

//var web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ROPSTEN_URL));

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));


var tokenContract = require('./_0xBitcoinToken.json');

if (process.argv.length <= 2) {
console. log("Please add a difficulty parameter (1-64)");
process. exit(-1);
}

var account_address =  process.argv[2] ;

var contract =  web3.eth.contract(tokenContract.abi).at(SMARTCONTRACT_ADDRESS)

Miner.init( web3 , contract, account_address )

/*
var Web3 = require('web3-eth')
const Miner = require("./0xbitcoinminer");


//var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var LOCAL_GETH = 'http://localhost:8545';

var SMARTCONTRACT_ADDRESS ='0x9ec7567938f19d08d1915c2ab7ed23c743e49e31'

//var web3 = new Web3(new Web3.providers.HttpProvider(LOCAL_GETH));
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));


if (process.argv.length <= 2) {
console. log("Please add a difficulty parameter (1-64)");
process. exit(-1);
}

var account_address =  process.argv[2] ;


var json = JSON.parse(require('fs').readFileSync('./_0xBitcoinToken.json', 'utf8'));
console.log(json.abi)

var contract = new web3.Contract(json.abi, SMARTCONTRACT_ADDRESS, {
   from: account_address, // default from address
   gasPrice: '2000000000' // default gas price in wei, 2 gwei in this case
});

var diff =   contract.methods.getMiningDifficulty().call({},function(error,result){

  console.log('difficulty:', result, error);
} ) ;



//Miner.init( web3 , contract, account_address )

*/
