var web3utils =  require('web3-utils');
var solidityHelper = require('./solidity-helper')
var leftpad =  require('leftpad');

const BN = require('bn.js');

var debugLogger = require('./lib/debug-logger')

var tokenContractJSON = require('./contracts/_0xBitcoinToken.json');

var CPUMiner = require('./build/Release/cpuminer');


//only load this if selecting 'gpu mine!!!'
var GPUMiner;

var tokenContract;

const PRINT_STATS_TIMEOUT = 5000;
const COLLECT_MINING_PARAMS_TIMEOUT = 4000;


module.exports =  {

    async init(contractAddress, web3, miningLogger )
  //  async init(web3, subsystem_command, vault, networkInterface, miningLogger)
    {

      if(this.useCUDA)
      {
        GPUMiner = require('./build/Release/gpuminer');
      }

        process.on('exit', () => {
            console.log("Process exiting... stopping miner");
            CPUMiner.stop();
        });

        tokenContract =  new web3.eth.Contract(tokenContractJSON.abi, contractAddress );

        this.miningLogger = miningLogger;



    },

    async mine(miningStyle, minerAccountAddress, minerPrivateKey, poolURL, gasPriceGwei)
    {

      this.miningStyle = miningStyle;

      //miningParameters


      console.log('Selected mining account:',  '\n',minerAccountAddress  );
      console.log('\n')
      console.log('Selected mining style:',  '\n',miningStyle  );
      console.log('\n')

      if(miningStyle == "solo")
      {

        console.log('Selected mining contract:',  tokenContract.address  );
        console.log('\n')
        console.log("Gas price is "+ gasPriceGwei + ' gwei');
        console.log('\n')

      }else if(miningStyle == "pool" )
      {

        console.log('Selected mining pool:',  '\n',poolURL  );
        console.log('\n')


      }else
      {
        console.error('ERROR: no mining style configured. Styles: solo, pool')
        return
      }


        var self = this;



       let miningParameters = {};
       await self.initMiningProcedure(miningStyle, minerAccountAddress );

      self.miningLogger.appendToStandardLog("Begin mining for " + minerAccountAddress + " with gasprice " +  gasPriceGwei );

      console.log("Mining for  "+ minerAccountAddress);



      setInterval(() => { self.printMiningStats() }, PRINT_STATS_TIMEOUT);


    },

     mineStuff(miningParameters, minerEthAddress, miningStyle) {
        if (!this.mining) {

            this.mineCoins(this.web3, miningParameters,   minerEthAddress, miningStyle);
        }
    },



    async initMiningProcedure(miningStyle, minerEthAddress,miningParameters )
    {

  //    console.log('collect parameters.. ')
      var self = this;

      try
      {

          if(miningStyle == "solo")
          {
            var parameters = await this.networkInterface.collectMiningParameters();
          }

          else if(miningStyle == "pool")
          {
            console.log('collecting mining params from pool ')
            var parameters = await this.poolInterface.collectMiningParameters(minerEthAddress,miningParameters );
            console.log('collected mining params from pool ')
          }
          else {
            console.error(' no mining style !', miningStyle)
          }

          //console.log('collected mining params ', parameters)
          //miningParameters.miningDifficulty = parameters.miningDifficulty;
        //  miningParameters.challengeNumber = parameters.challengeNumber;
      //    miningParameters.miningTarget = parameters.miningTarget;
        //  miningParameters.poolEthAddress = parameters.poolEthAddress;

          //give data to the c++ addon


          //starts mining
          await this.refreshCPUMinerWithParameters(minerEthAddress, parameters,miningStyle)

    }catch(e)
    {
      console.log(e)
    }


      //keep on looping!
        setTimeout(function(){self.initMiningProcedure(miningStyle, minerEthAddress,miningParameters  )},COLLECT_MINING_PARAMS_TIMEOUT);
    },

    async refreshCPUMinerWithParameters(minerEthAddress, miningParameters,miningStyle){



       let bResume = false;


        if(miningStyle == 'pool' && this.challengeNumber != null)
        {
          //if we are in a pool, keep mining again because our soln probably didnt solve the whole block and we want shares
        //   bResume = true;
          CPUMiner.setChallengeNumber(this.challengeNumber);
         bResume = true;
        }


          if(this.challengeNumber != miningParameters.challengeNumber)
          {
              this.challengeNumber = miningParameters.challengeNumber

              console.log("New challenge number: " + this.challengeNumber);
              CPUMiner.setChallengeNumber(this.challengeNumber);
               bResume = true;
            }


            if(this.miningTarget  == null || !this.miningTarget.eq(miningParameters.miningTarget   ) )
            {
              this.miningTarget = miningParameters.miningTarget

               console.log("New mining target: 0x" + this.miningTarget.toString(16));
               CPUMiner.setDifficultyTarget("0x" + this.miningTarget.toString(16));
             }

             if(this.miningDifficulty != miningParameters.miningDifficulty)
             {

              this.miningDifficulty = miningParameters.miningDifficulty

               console.log("New difficulty: " + this.miningDifficulty);
             }


               if (bResume && !this.mining) {
                   console.log("Restarting mining operations");

                   try
                   {
                     this.mineStuff(miningParameters, minerEthAddress, miningStyle);

                   }catch(e)
                   {
                     console.log(e)
                   }


               }


    },



    async submitNewMinedBlock( addressFrom, minerEthAddress, solution_number,digest_bytes,challenge_number, target, difficulty)

    //async submitNewMinedBlock(addressFrom, solution_number, digest_bytes, challenge_number)
    {
        this.miningLogger.appendToStandardLog("Giving mined solution to network interface " + challenge_number);


        if(this.miningStyle == "solo")
        {
          this.networkInterface.queueMiningSolution(addressFrom, minerEthAddress, solution_number , digest_bytes , challenge_number, target, difficulty)
        }

        if(this.miningStyle == "pool")
        {
          this.poolInterface.queueMiningSolution(addressFrom, minerEthAddress, solution_number , digest_bytes , challenge_number, target, difficulty);
        }


    },

    // contractData , -> miningParameters
      mineCoins(web3, miningParameters, minerEthAddress, poolEthAddress, miningStyle)
    {


      var target = miningParameters.miningTarget;
      var difficulty = miningParameters.miningDifficulty;


      var addressFrom;

      if(  miningStyle == "pool" ){
          addressFrom =  poolEthAddress;
      }else{
          addressFrom = minerEthAddress;
      }


        CPUMiner.setMinerAddress(addressFrom);

        var self = this;

        const verifyAndSubmit = (solution_number) => {
            const challenge_number = miningParameters.challengeNumber;
            const digest = web3utils.sha3(challenge_number + addressFrom.substring(2) + solution_number.substring(2));
            const digestBigNumber = web3utils.toBN(digest);
            if (digestBigNumber.lte(miningParameters.miningTarget)) {
                console.log('Submit mined solution for challenge ', challenge_number);
              //  self.submitNewMinedBlock(minerEthAddress, solution_number, digest, challenge_number);
                    self.submitNewMinedBlock( addressFrom, minerEthAddress, solution_number,digest,challenge_number, target, difficulty)



            } else {
                console.error("Verification failed!\n",
                "challenge: ", challenge_number, "\n",
                "address: ", minerEthAddress, "\n",
                "solution: ", solution_number, "\n",
                "digest: ", digestBigNumber, "\n",
                "target: ", target);
            }
        }

        self.mining = true;

        debugLogger.log('MINING:',self.mining)

       CPUMiner.stop();
        CPUMiner.run( (err, sol) => {
            if (sol) {
                console.log("Solution found!");

                try{
                verifyAndSubmit(sol);
                }catch(e)
                {
                  console.log(e)
                }
            }
          //  console.log("Stopping mining operations until the next block...");
          self.mining = false;

         debugLogger.log('MINING:',self.mining)

        });
    },


    setNetworkInterface(netInterface)
    {
        this.networkInterface = netInterface;
    },

    setPoolInterface(poolInterface)
    {
        this.poolInterface = poolInterface;
    },


    printMiningStats()
    {

      var hashes = CPUMiner.hashes();
      console.log('hashes:', hashes )
        console.log('Hash rate: ' + parseInt( hashes / PRINT_STATS_TIMEOUT) + " kH/s");
    }

}
