var Web3 = require('web3')

var web3Utils = require('web3-utils')

const Miner = require("./0xbitcoinminer");

const Vault = require("./lib/vault");

var NetworkInterface = require("./lib/network-interface");

var ContractInterface = require("./contracts/DeployedContractInfo")

var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';

var web3 = new Web3(new Web3.providers.HttpProvider(INFURA_ROPSTEN_URL));


//console.log(web3)
//var web3 = new Web3();
//web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));



//send tx
// https://gist.github.com/raineorshine/c8b30db96d7532e15f85fcfe72ac719c
// providers https://github.com/MetaMask/provider-engine


// Build a wallet vault ??



// the address that will send the test transaction
const addressFrom = Vault.getAccount().public_address // '0x1889EF49cDBaad420EB4D6f04066CA4093088Bbd'
const privKey = Vault.getAccount().private_key


// the destination address
const smartContractAddress = ContractInterface.contracts._0xbitcointoken.blockchain_address;


var tokenContractJSON = require('./contracts/_0xBitcoinToken.json');


if (process.argv.length <= 2) {
console. log("Please add a subsystem parameter (use 'npm run help' for help)");
process. exit(-1);
}

var subsystem_name =  process.argv[2] ;
var subsystem_command =  process.argv[3] ;

var contract =  new web3.eth.Contract(tokenContractJSON.abi,smartContractAddress)


/*
  NetworkInterface.submitMiningSolution( addressFrom, 999 , web3Utils.sha3('hiii') ,
    function(result){
     console.log('submit mining soln:' , error,result)
   });
*/
if(subsystem_name == 'account')
{
  Vault.handleCommand(subsystem_command)
}

if(subsystem_name == 'mine')
{
  NetworkInterface.init(web3,contract, Vault);
  Miner.init( web3 , contract, subsystem_command, Vault, NetworkInterface );
}

if(subsystem_name == 'help')
{
  console.log('--0xBitcoin Miner Help--')
  console.log('Available commands:')
  console.log('"npm run account new" - Create a new mining account "')
  console.log('"npm run account list" - List all mining accounts "')
  console.log('"npm run account #" - Select a mining account by number "')
}
