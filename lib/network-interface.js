
var web3Utils = require('web3-utils')

const Tx = require('ethereumjs-tx')

//const Vault = require("./vault");


var tokenContractJSON = require('../contracts/_0xBitcoinToken.json');


var busySendingSolution = false;
var queuedMiningSolutions = [];


var lastSubmittedMiningSolutionChallengeNumber;

module.exports =  {


  init(web3,  miningLogger, contractAddress, gasPriceGwei, minerPrivateKey)
  {
    this.web3=web3;

    this.gas_price_gwei=gasPriceGwei;

    this.miner_private_key=minerPrivateKey;

    this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi, contractAddress)

    this.miningLogger = miningLogger;


    busySendingSolution = false;

    var self= this;

    setInterval(function(){ self.sendMiningSolutions()} , 500)

  },



    async checkMiningSolution(addressFrom,solution_number,challenge_digest,challenge_number,target,callback){

      this.tokenContract.methods.checkMintSolution(solution_number,challenge_digest, challenge_number, target).call(callback)

    },


  async sendMiningSolutions()
    {

      var self = this;

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
            var response = await this.submitMiningSolution(nextSolution.hashingEthAddress,
              nextSolution.solution_number, nextSolution.challenge_digest  );
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


  queueMiningSolution( solnData )
  {

    //console.log('pushed solution to stack')
    queuedMiningSolutions.push( solnData );

  },

  async submitMiningSolution(addressFrom,solution_number,challenge_digest){

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

    var gweiToWei = 1e9;


    var gas_price_wei = this.gas_price_gwei * gweiToWei;
    var max_gas_cost = 1704624;



   // var estimatedGasCost = await mintMethod.estimateGas({gas: max_gas_cost, from:addressFrom, to: addressTo });


    //console.log('estimatedGasCost',estimatedGasCost);
    console.log('txData',txData);

    console.log('addressFrom',addressFrom);
    console.log('addressTo',addressTo);



    //if( estimatedGasCost > max_gas_cost){
    //  console.log("Gas estimate too high!  Something went wrong ")
    //  return;
    //}


    const txOptions = {
      nonce: web3Utils.toHex(txCount),
   //   gas: web3Utils.toHex(estimatedGasCost),   //?
      gasPrice: web3Utils.toHex( gas_price_wei ),
      value: 0,
      to: addressTo,
      from: addressFrom,
      data: txData
    }


      var pKey = this.miner_private_key;


  return new Promise(function (result,error) {

       this.sendSignedRawTransaction(this.web3,txOptions,addressFrom, pKey, function(err, res) {
        if (err) error(err)
          result(res)
      })

    }.bind(this));


  },




  async sendSignedRawTransaction(web3,txOptions,addressFrom, pKey ,callback) {


    var fullPrivKey = pKey;

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
