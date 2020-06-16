var MINING_POOL_URL = 'http://tokenminingpool.com:8586';




var web3Utils = require('web3-utils')

const Tx = require('ethereumjs-tx')


var jayson = require('jayson');

var tokenContractJSON = require('../contracts/_0xBitcoinToken.json');


var busySendingSolution = false;
var queuedMiningSolutions = [];


var lastSubmittedMiningSolutionChallengeNumber;


var startedMining = false;


module.exports =  {


  init(web3, miningLogger, contractAddress, miningPoolURL)
  {
    this.web3=web3;

    this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,contractAddress)

    this.miningLogger = miningLogger;


    busySendingSolution = false;


    this.miningPoolURL = miningPoolURL;

  /*  if(this.vault.getMiningPool() == null)
    {
      this.vault.selectMiningPool(MINING_POOL_URL)
    }*/

    this.jsonrpcClient = jayson.client.http( miningPoolURL );




    setInterval(function(){ this.sendMiningSolutions()}.bind(this), 500)

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

      this.poolEthAddress = poolEthAddress;
      //this.poolMinimumShareDifficulty = poolMinimumShareDifficulty;
      this.receivedPoolConfig = true;

    //  console.log('got new target ', poolMinimumShareTarget ,web3Utils.toBN( poolMinimumShareTarget ) )


    if(typeof previousMiningParameters == 'undefined')
    {

      console.error("internal error: missing mining parameters")
    }

    if(poolChallengeNumber == null)
    {
      poolChallengeNumber = previousMiningParameters.challengeNumber;
    }



    if(  poolChallengeNumber != previousMiningParameters.challengeNumber)
    {
      console.log('\n')
      console.log('Got new pool challenge number ',  poolChallengeNumber )
    }

    //why is this firing each time ?
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
            var response = await this.submitMiningSolution(nextSolution);
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



    queueMiningSolution(solnData )
 {

    //console.log('pushed solution to stack')
  /*  queuedMiningSolutions.push({
      addressFrom: addressFrom, //the pool in the pools case,  the miner if solo mining
      minerEthAddress: minerEthAddress, // ALWAYS miner eth address
      poolEthAddress: poolEthAddress,
      solution_number: solution_number,
      challenge_digest: challenge_digest,
      challenge_number: challenge_number,
      target: target,
      difficulty: difficulty
    }); */

    queuedMiningSolutions.push(solnData);

  },

  async submitMiningSolution(soln){
  //(addressFrom,minerEthAddress,poolEthAddress, solution_number,challenge_number, c
  //hallenge_digest, target, difficulty){

       this.miningLogger.appendToStandardLog("Submitting Solution " + soln.challenge_digest)


       console.log('sha3inputs ', [soln.challenge_number , soln.poolEthAddress, soln.solution_number ])
       var computed_digest =  web3Utils.soliditySha3( soln.challenge_number , soln.poolEthAddress, soln.solution_number )
       console.log ( 'computed_digest', computed_digest)


    console.log( '\n' )
    console.log( '---Submitting solution to pool for shares---')
    console.log( 'nonce ',soln.solution_number )
    console.log( 'challenge_digest ',soln.challenge_digest )
    console.log( 'minerEthAddress ',soln.minerEthAddress )
    console.log( 'challenge_number ',soln.challenge_number )
    console.log( 'target ',soln.target )
    console.log( 'difficulty ',soln.difficulty )
    console.log( '\n' )



    var rpcClient = this.jsonrpcClient;


     var args = []
     args[0] = soln.solution_number;
     args[1] = soln.minerEthAddress;
     args[2] = soln.challenge_digest;
     args[3] = soln.difficulty;
     args[4] = soln.challenge_number;


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





   truncate0xFromString(s)
  {
    if(s.startsWith('0x')){
      return s.substring(2);
    }
    return s;
  }





}
