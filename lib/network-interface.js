
var web3Utils = require('web3-utils')
var ContractInterface = require("../contracts/DeployedContractInfo")


const Tx = require('ethereumjs-tx')

const Vault = require("./vault");

module.exports =  {



  async submitMiningSolution(web3,addressFrom,vault){


    const addressTo = ContractInterface.contracts._0xbitcointoken.blockchain_address;

      console.log('addressFrom',addressFrom)

      try{
        var txCount = await web3.eth.getTransactionCount(addressFrom);
        console.log('txCount',txCount)
       } catch(error) {  //here goes if someAsyncPromise() rejected}
        console.log(error);
         return error;    //this will result in a resolved promise.
       }



    const txData = {
      nonce: web3Utils.toHex(txCount),
      gasLimit: web3Utils.toHex(25000),
      gasPrice: web3Utils.toHex(10e9), // 10 Gwei
      to: addressTo,
      from: addressFrom,
      value: web3Utils.toHex(web3Utils.toWei('123', 'wei'))
    }

    // fire away!

    console.log('fire away ')
    await this.sendSigned(web3,txData,addressFrom,vault, function(err, result) {
      if (err) return console.log('error', err)
      console.log('sent', result)
    })

  },


  async sendSigned(web3,txData,addressFrom,vault,callback) {


    var privKey = vault.getAccount().private_key;

    const privateKey = new Buffer( privKey, 'hex')
    const transaction = new Tx(txData)



    transaction.sign(privateKey)
    const serializedTx = transaction.serialize().toString('hex')

    console.log('serializedTx',serializedTx)


      var result = await   web3.eth.sendRawTransaction('0x' + serializedTx, callback)

  }




}
