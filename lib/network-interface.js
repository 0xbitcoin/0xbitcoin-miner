
var web3Utils = require('web3-utils')
var ContractInterface = require("../contracts/DeployedContractInfo")


const Tx = require('ethereumjs-tx')

const Vault = require("./vault");

module.exports =  {


  init(web3,tokenContract,vault)
  {
    this.web3=web3;
    this.tokenContract = tokenContract;
    this.vault=vault;
  },

  async submitMiningSolution(addressFrom,nonce,digest_bytes,callback){

    //  var addressFrom = this.vault.getAccount().public_address ;

    var solution_number = nonce;
    var challenge_digest = digest_bytes;
    //console.log( 'LALALALL' )

    console.log( 'solution_number',solution_number )
    console.log( 'challenge_digest',challenge_digest )


   var mintMethod = this.tokenContract.methods.mintTestB(solution_number,challenge_digest);

   console.log(mintMethod)

  try{
    var txCount = await this.web3.eth.getTransactionCount(addressFrom);
    console.log('txCount',txCount)
   } catch(error) {  //here goes if someAsyncPromise() rejected}
    console.log(error);
     return error;    //this will result in a resolved promise.
   }


   var addressTo = this.tokenContract.options.address;


  /*  tokenContract.mint.sendTransaction(solution_number,challenge_digest,
          {
            from: addressFrom,
        //    gas:4000000,
            nonce: web3Utils.toHex(txCount), //manipulate me to resend transactions !
            gasLimit: web3Utils.toHex(25000),
            gasPrice: web3Utils.toHex(2e9),
          },
          callback
        );*/


  //const addressTo = ContractInterface.contracts._0xbitcointoken.blockchain_address;


    // Automatically determines the use of call or sendTransaction based on the method type
    //tokenContract.mint(param1 [, param2, ...] [, transactionObject] [, defaultBlock] [, callback]);


/*
    mintMethod.send({
        from: addressFrom,
        nonce: nonce,
        gasLimit: web3Utils.toHex(25000),
        gasPrice: web3Utils.toHex(2e9), // 2 Gwei
    })
    .then(function(receipt){
      callback(receipt)
        // receipt can also be a new contract instance, when coming from a "contract.deploy({...}).send()"
    });*/


    //var txData = mintMethod.encodeABI();


    var txData = this.web3.eth.abi.encodeFunctionCall({
            name: 'mintTestB',
            type: 'function',
            inputs: [{
                type: 'uint256',
                name: 'nonce'
            },{
                type: 'bytes32',
                name: 'challenge_digest'
            }]
        }, [solution_number, challenge_digest]);

    var estimatedGasCost = await mintMethod.estimateGas({from:addressFrom, to: addressTo });

    console.log('estimatedGasCost',estimatedGasCost);
    console.log('txData',txData);

    console.log('addressFrom',addressFrom);
    console.log('addressTo',addressTo);


    const txOptions = {
      nonce: web3Utils.toHex(txCount),
      gas: web3Utils.toHex(1704624),
      gasPrice: web3Utils.toHex(2e9), // 2 Gwei
      to: addressTo,
      from: addressFrom,
      data: txData
    }

    // fire away!

    console.log('fire away ')
    await this.sendSignedRawTransaction(this.web3,txOptions,addressFrom,this.vault, function(err, result) {
      if (err) return console.log('error', err)
      console.log('sent', result)
    })


  },


  async submitSignedTx(web3,addressFrom,vault){


  //const addressTo = ContractInterface.contracts._0xbitcointoken.blockchain_address;
    const addressTo = "0xB11ca87E32075817C82Cc471994943a4290f4a14"

      console.log('addressFrom',addressFrom)

      try{
        var txCount = await web3.eth.getTransactionCount(addressFrom);
        console.log('txCount',txCount)
       } catch(error) {  //here goes if someAsyncPromise() rejected}
        console.log(error);
         return error;    //this will result in a resolved promise.
       }





    const txOptions = {
      nonce: web3Utils.toHex(txCount),
      gasLimit: web3Utils.toHex(25000),
      gasPrice: web3Utils.toHex(2e9), // 2 Gwei
      to: addressTo,
      from: addressFrom,
      value: web3Utils.toHex(web3Utils.toWei('123', 'wei'))
    //  value: web3Utils.toHex(web3Utils.toWei('123', 'wei'))
    }

    // fire away!

    console.log('fire away ')
    await this.sendSignedRawTransaction(web3,txOptions,addressFrom,vault, function(err, result) {
      if (err) return console.log('error', err)
      console.log('sent', result)
    })



  },

  async sendSignedRawTransaction(web3,txOptions,addressFrom,vault,callback) {


    var privKey = vault.getAccount().private_key;

    const privateKey = new Buffer( privKey, 'hex')
    const transaction = new Tx(txOptions)



    transaction.sign(privateKey)
    const serializedTx = transaction.serialize().toString('hex')

    console.log('serializedTx',serializedTx)


      var result = await web3.eth.sendSignedTransaction('0x' + serializedTx, callback)

  }




}
