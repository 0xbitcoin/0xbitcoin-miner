var Web3 = require('web3')
const Miner = require("./0xbitcoinminer");

const Vault = require("./lib/vault");

var NetworkInterface = require("./lib/network-interface");

var ContractInterface = require("./contracts/DeployedContractInfo")

var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';

var web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ROPSTEN_URL));


console.log(web3)
//var web3 = new Web3();
//web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));



//send tx
// https://gist.github.com/raineorshine/c8b30db96d7532e15f85fcfe72ac719c
// providers https://github.com/MetaMask/provider-engine


// Build a wallet vault ??



// the address that will send the test transaction
const addressFrom = Vault.getAccount().public_address // '0x1889EF49cDBaad420EB4D6f04066CA4093088Bbd'
const privKey = Vault.getAccount().private_key

console.log(addressFrom)

// the destination address
const smartContractAddress = ContractInterface.contracts._0xbitcointoken.blockchain_address;


var tokenContract = require('./contracts/_0xBitcoinToken.json');

/*
if (process.argv.length <= 2) {
console. log("Please add a difficulty parameter (1-64)");
process. exit(-1);
}

var account_address =  process.argv[2] ;
*/

var contract =  new web3.eth.Contract(tokenContract.abi,smartContractAddress)



 NetworkInterface.submitMiningSolution(web3,addressFrom,contract, Vault,function(result){
   console.log('submit mining soln:' , error,result)
 })




//  Miner.init( web3 , contract, Vault.getAccount().public_address )
