var MINING_POOL_URL = 'http://tokenminingpool.com:8586';

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

    if(this.vault.getMiningPool() == null)
    {
      this.vault.selectMiningPool(MINING_POOL_URL)
    }

    this.jsonrpcClient = jayson.client.http(
      this.vault.getMiningPool()
     );


 

    setInterval(function(){ this.sendMiningSolutions()}.bind(this), 500)

  },



  async handlePoolCommand(subsystem_command,subsystem_option)
  {

    if(subsystem_command === 'select')
    {
      this.vault.selectMiningPool(subsystem_option); //pool url
      await this.vault.saveVaultData(  );

    }

    if(subsystem_command === 'show' || subsystem_command === 'list')
    {
       console.log('Selected mining pool:   ',this.vault.getMiningPool())
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
    async collectMiningParameters(minerEthAddress, previousMiningParameters)
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

           rpcClient.request('getMinimumShareDifficulty', [minerEthAddress], function(err, response) {
             if(err) {rejected(err); return;}
             if(typeof response == 'undefined') {rejected(response); return;}
              fulfilled(response.result)
            });

          });

    var poolMinimumShareTarget = await new Promise(function (fulfilled,rejected) {

         rpcClient.request('getMinimumShareTarget', [minerEthAddress], function(err, response) {
           if(err) {rejected(err); return;}
           if(typeof response == 'undefined') {rejected(response); return;}
            fulfilled(response.result)
          });

        });

    //  this.poolEthAddress = poolEthAddress;
      //this.poolMinimumShareDifficulty = poolMinimumShareDifficulty;
      this.receivedPoolConfig = true;

    //  console.log('got new target ', poolMinimumShareTarget ,web3Utils.toBN( poolMinimumShareTarget ) )


    if(poolChallengeNumber == null)
    {
      poolChallengeNumber = previousMiningParameters.challengeNumber;
    }



    if(  poolChallengeNumber != previousMiningParameters.challengeNumber)
    {
      console.log('\n')
      console.log('Got new challenge number ',  poolChallengeNumber )
    }

    if(typeof previousMiningParameters.miningTarget == 'undefined' ||  ! web3Utils.toBN( poolMinimumShareTarget ).eq( web3Utils.toBN(previousMiningParameters.miningTarget ) ) )
    {
      console.log('\n')
      console.log('Got new pool difficulty target ',   poolMinimumShareTarget  )
    }

       return {
        miningDifficulty: poolMinimumShareDifficulty,
        challengeNumber: poolChallengeNumber,
        miningTarget: web3Utils.toBN( poolMinimumShareTarget ),
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


            //in the pool miner we send the next soln to the pool regardless

        //  if( nextSolution.challenge_number != lastSubmittedMiningSolutionChallengeNumber)
        //  {
          //  lastSubmittedMiningSolutionChallengeNumber =  nextSolution.challenge_number;

            try{
            var response = await this.submitMiningSolution(nextSolution.addressFrom, nextSolution.minerEthAddress,
              nextSolution.solution_number, nextSolution.challenge_number, nextSolution.challenge_digest, nextSolution.target, nextSolution.difficulty);
            }catch(e)
            {
              this.miningLogger.appendToErrorLog(e)
              console.log(e);
            }
      //    }


          busySendingSolution = false;
        }
      }



    },



    queueMiningSolution(addressFrom,minerEthAddress,solution_number,challenge_digest, challenge_number, target, difficulty )
 {

    //console.log('pushed solution to stack')
    queuedMiningSolutions.push({
      addressFrom: addressFrom, //the pool in the pools case,  the miner if solo mining
      minerEthAddress: minerEthAddress, // ALWAYS miner eth address
      solution_number: solution_number,
      challenge_digest: challenge_digest,
      challenge_number: challenge_number,
      target: target,
      difficulty: difficulty
    });

  },

  async submitMiningSolution(addressFrom,minerEthAddress, solution_number,challenge_number, challenge_digest, target, difficulty){

    //  var addressFrom = this.vault.getAccount().public_address ;
    this.miningLogger.appendToStandardLog("Submitting Solution " + challenge_digest)


    console.log( '\n' )
    console.log( '---Submitting solution to pool for shares---')
    console.log( 'nonce ',solution_number )
    console.log( 'challenge_digest ',challenge_digest )
    console.log( 'challenge_number ',challenge_number )
    console.log( 'target ',target )
    console.log( 'difficulty ',difficulty )
    console.log( '\n' )



    var rpcClient = this.jsonrpcClient;


     var args = []
     args[0] = solution_number;
     args[1] = minerEthAddress;
     args[2] = challenge_digest;
     args[3] = difficulty;
     args[4] = challenge_number;


     //add me
     //args[5] = worker_name;
     //args[6] = hashrate;

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
