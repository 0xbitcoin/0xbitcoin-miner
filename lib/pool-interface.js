
var web3Utils = require('web3-utils')

const Tx = require('ethereumjs-tx')

const Vault = require("./vault");

var jayson = require('jayson');

var tokenContractJSON = require('../contracts/_0xBitcoinToken.json');


var busySendingSolution = false;
var queuedMiningSolutions = [];


var lastSubmittedMiningSolutionChallengeNumber;

module.exports =  {


  init(web3,subsystem_command,vault ,miningLogger)
  {
    this.web3=web3;

    this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,vault.getTokenContractAddress())

    this.miningLogger = miningLogger;

    this.vault=vault;

    busySendingSolution = false;

    this.jsonrpcClient = jayson.client.http(
      this.vault.getMiningPool()
     );

  //   console.log('query pool config')
    // this.collectMiningParameters();

    setInterval(function(){ this.sendMiningSolutions()}.bind(this), 500)

  },



  async handlePoolCommand(subsystem_command,subsystem_option)
  {

    if(subsystem_command === 'select')
    {
      this.vault.selectMiningPool(subsystem_option); //pool url
      this.vault.saveVaultData(  );

    }

    if(subsystem_command === 'show' || subsystem_command === 'list')
    {
       console.log('Selected mining pool:',this.vault.getMiningPool())
    }

  },

/*
    async checkMiningSolution(addressFrom,solution_number,challenge_digest,challenge_number,target,callback){

      this.tokenContract.methods.checkMintSolution(solution_number,challenge_digest, challenge_number, target).call(callback)

    },

*/




  //the miner will ask for this info to help find solutions !!

  hasReceivedPoolConfig()
  {
    return this.receivedPoolConfig;
  },

  getPoolEthAddress()
  {
    return this.poolEthAddress;
  },

  getMinimumShareDifficulty()
  {
      return this.poolMinimumShareDifficulty;
  },




    //JSONRPC interface to the pool
    async collectMiningParameters(miningParameters)
    {

      // create a client

      var rpcClient = this.jsonrpcClient;

       var args = []

      var poolEthAddress = await new Promise(function (fulfilled,rejected) {

           rpcClient.request('getPoolEthAddress', args, function(err, response) {
              if(err) {rejected(err); return;}
              if(typeof response == 'undefined') {rejected(response); return;}

              fulfilled(response.result)
            });

          });

      var poolChallengeNumber = await new Promise(function (fulfilled,rejected) {

           rpcClient.request('getChallengeNumber', args, function(err, response) {
             if(err) {rejected(err); return;}
             if(typeof response == 'undefined') {rejected(response); return;}
              fulfilled(response.result)
            });

          });

      var poolMinimumShareDifficulty = await new Promise(function (fulfilled,rejected) {

           rpcClient.request('getMinimumShareDifficulty', args, function(err, response) {
             if(err) {rejected(err); return;}
             if(typeof response == 'undefined') {rejected(response); return;}
              fulfilled(response.result)
            });

          });

    var poolMinimumShareTarget = await new Promise(function (fulfilled,rejected) {

         rpcClient.request('getMinimumShareTarget', args, function(err, response) {
           if(err) {rejected(err); return;}
           if(typeof response == 'undefined') {rejected(response); return;}
            fulfilled(response.result)
          });

        });

    //  this.poolEthAddress = poolEthAddress;
      //this.poolMinimumShareDifficulty = poolMinimumShareDifficulty;
      this.receivedPoolConfig = true;

      return {
        miningDifficulty: poolMinimumShareDifficulty,
        challengeNumber: poolChallengeNumber,
        miningTarget: poolMinimumShareTarget,
        poolEthAddress: poolEthAddress
      };

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



  queueMiningSolution(addressFrom,solution_number,challenge_digest, challenge_number)
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



    var rpcClient = this.jsonrpcClient;

    var difficulty = 11; //fix me


     var args = []
     args[0] = solution_number;
     args[1] = addressFrom;
     args[2] = challenge_digest;
     args[3] = difficulty;

    return new Promise(function (fulfilled,rejected) {

         rpcClient.request('submitShare', args, function(err, response) {
            if(err) {rejected(err);return}
            if(typeof response == 'undefined') {rejected(response); return;}
            fulfilled(response.result)
          });

        });





  },




  async sendSignedRawTransaction(web3,txOptions,addressFrom,vault,callback) {


    var fullPrivKey = vault.getAccount().privateKey;

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
