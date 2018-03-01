
var web3Utils = require('web3-utils')

const Tx = require('ethereumjs-tx')

const Vault = require("./vault");


var tokenContractJSON = require('../contracts/_0xBitcoinToken.json');


var busySendingSolution = false;
var queuedMiningSolutions = [];


var lastSubmittedMiningSolutionChallengeNumber;

module.exports =  {


  init(web3,vault, miningLogger)
  {
    this.web3=web3;

    this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,vault.getTokenContractAddress())

    this.miningLogger = miningLogger;

    this.vault=vault;

    busySendingSolution = false;

    var self= this;

    setInterval(function(){ self.sendMiningSolutions()} , 500)

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
          //busySendingSolution = true;


          var nextSolution = queuedMiningSolutions.pop();

          this.miningLogger.appendToStandardLog("Popping queued mining solution " + nextSolution.toString())


          if( nextSolution.challenge_number != lastSubmittedMiningSolutionChallengeNumber)
          {
            lastSubmittedMiningSolutionChallengeNumber =  nextSolution.challenge_number;
            //console.log('popping mining solution off stack ')

            try{
            var response = await this.submitMiningSolution(nextSolution.addressFrom,
              nextSolution.solution_number, nextSolution.challenge_digest);
            }catch(e)
            {
              this.miningLogger.appendToErrorLog(e)
              console.log(e);
            }
          }


          busySendingSolution = false;
        }
      }



    },


    async collectMiningParameters( )
    {

      var miningDifficultyString = await this.tokenContract.methods.getMiningDifficulty().call()  ;
      var miningDifficulty = parseInt(miningDifficultyString)

      var miningTargetString = await this.tokenContract.methods.getMiningTarget().call()  ;
      var miningTarget = web3Utils.toBN(miningTargetString)

      var challengeNumber = await this.tokenContract.methods.getChallengeNumber().call() ;

      //console.log('Mining difficulty:', miningDifficulty);
      //console.log('Challenge number:', challengeNumber)

      return {
        miningDifficulty: miningDifficulty,
        challengeNumber: challengeNumber,
        miningTarget: miningTarget
      };

    },


  queueMiningSolution(addressFrom,minerEthAddress,solution_number,challenge_digest, challenge_number, target, difficulty )
  {

    //console.log('pushed solution to stack')
    queuedMiningSolutions.push({
      addressFrom: addressFrom,
      solution_number: solution_number,
      challenge_digest: challenge_digest,
      challenge_number: challenge_number
    });

  },

  async submitMiningSolution(addressFrom,solution_number,challenge_digest){

    //  var addressFrom = this.vault.getAccount().public_address ;
    this.miningLogger.appendToStandardLog("Submitting Solution " + challenge_digest)



    console.log( '\n' )
    console.log( '---Submitting solution for reward---')
    console.log( 'nonce ',solution_number )
    console.log( 'challenge_digest ',challenge_digest )
    console.log( '\n' )

   var mintMethod = this.tokenContract.methods.mint(solution_number,challenge_digest);

  try{
    var txCount = await this.web3.eth.getTransactionCount(addressFrom);
    console.log('txCount',txCount)
   } catch(error) {  //here goes if someAsyncPromise() rejected}
    console.log(error);
      this.miningLogger.appendToErrorLog(error)
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



    var max_gas_cost = 1704624;

    var estimatedGasCost = await mintMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });


    console.log('estimatedGasCost',estimatedGasCost);
    console.log('txData',txData);

    console.log('addressFrom',addressFrom);
    console.log('addressTo',addressTo);



    if( estimatedGasCost > max_gas_cost){
      console.log("Gas estimate too high!  Something went wrong ")
      return;
    }


    const txOptions = {
      nonce: web3Utils.toHex(txCount),
      gas: web3Utils.toHex(estimatedGasCost),   //?
      gasPrice: web3Utils.toHex(this.vault.getGasPriceWei()),
      value: 0,
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




  async sendSignedRawTransaction(web3,txOptions,addressFrom,vault,callback) {


    var fullPrivKey = vault.getFullAccount().privateKey;

    var privKey = this.truncate0xFromString( fullPrivKey )

    const privateKey = new Buffer( privKey, 'hex')
    const transaction = new Tx(txOptions)


    transaction.sign(privateKey)


    const serializedTx = transaction.serialize().toString('hex')

      try
      {
        var result =  web3.eth.sendSignedTransaction('0x' + serializedTx, callback)
      }catch(e)
      {
        console.log(e);
      }
  },


   truncate0xFromString(s)
  {

    if(s.startsWith('0x')){
      return s.substring(2);
    }
    return s;
  }





}
