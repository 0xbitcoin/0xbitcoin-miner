
var web3Utils = require('web3-utils')

const Tx = require('ethereumjs-tx')

const Vault = require("./vault");


var tokenContractJSON = require('../contracts/_0xBitcoinToken.json');


var busySendingSolution = false;
var queuedMiningSolutions = [];


var lastSubmittedMiningSolutionChallengeNumber;

module.exports =  {


  init(web3,vault)
  {
    this.web3=web3;
   
    this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,vault.getTokenContractAddress())


    this.vault=vault;

    busySendingSolution = false;

    setInterval(function(){ this.sendMiningSolutions()}.bind(this), 500)

  },



    async checkMiningSolution(addressFrom,solution_number,challenge_digest,challenge_number,target,callback){

      this.tokenContract.methods.checkMintSolution(solution_number,challenge_digest, challenge_number, target).call(callback)

    },


  async sendMiningSolutions()
    {


    //  console.log( 'sendMiningSolutions' )
      if(busySendingSolution == false)
      {
        if(queuedMiningSolutions.length > 0)
        {
          busySendingSolution = true;
          var nextSolution = queuedMiningSolutions.pop();

          if( nextSolution.challenge_number != lastSubmittedMiningSolutionChallengeNumber)
          {
            lastSubmittedMiningSolutionChallengeNumber =  nextSolution.challenge_number;
            console.log('popping mining solution off stack ')

            try{
            var response = await this.submitMiningSolution(nextSolution.addressFrom,
              nextSolution.solution_number, nextSolution.challenge_digest);
            }catch(e)
            {
              console.log(e);
            }
          }


          console.log('response',response)
          busySendingSolution = false;
        }
      }



    },



  queueMiningSolution(addressFrom,solution_number,challenge_digest, challenge_number)
  {

    console.log('pushed solution to stack')
    queuedMiningSolutions.push({
      addressFrom: addressFrom,
      solution_number: solution_number,
      challenge_digest: challenge_digest,
      challenge_number: challenge_number
    });

  },

  async submitMiningSolution(addressFrom,solution_number,challenge_digest){

    //  var addressFrom = this.vault.getAccount().public_address ;


    console.log( 'submitMiningSolution' )
    console.log( 'solution_number',solution_number )
    console.log( 'challenge_digest',challenge_digest )


   var mintMethod = this.tokenContract.methods.mint(solution_number,challenge_digest);

  try{
    var txCount = await this.web3.eth.getTransactionCount(addressFrom);
    console.log('txCount',txCount)
   } catch(error) {  //here goes if someAsyncPromise() rejected}
    console.log(error);
     return error;    //this will result in a resolved promise.
   }


   var addressTo = this.tokenContract.options.address;



    var txData = this.web3.eth.abi.encodeFunctionCall({
            name: 'mint',
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

   

  return new Promise(function (result,error) {

       this.sendSignedRawTransaction(this.web3,txOptions,addressFrom,this.vault, function(err, res) {
        if (err) error(err)
          result(res)
      })

    }.bind(this));


  },


  async submitSignedTx(web3,addressFrom,vault){


  const addressTo = vault.getTokenContractAddress();
    //const addressTo = "0xB11ca87E32075817C82Cc471994943a4290f4a14"

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


    var fullPrivKey = vault.getAccount().privateKey;

    var privKey = this.truncate0xFromString( fullPrivKey )

  //  'a6c4ca8fdbb9bf6c4424832fe970c034282a3a8ae31339b7b5c64478dbebf366'

    const privateKey = new Buffer( privKey, 'hex')
    const transaction = new Tx(txOptions)


    transaction.sign(privateKey)


    const serializedTx = transaction.serialize().toString('hex')


      var result =  web3.eth.sendSignedTransaction('0x' + serializedTx, callback)

  },


   truncate0xFromString(s)
  {
    if(s.startsWith('0x')){
      return s.substring(2);
    }
    return s;
  }





}
