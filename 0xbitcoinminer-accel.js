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

    async init(web3,  vault, miningLogger)
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

        tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,vault.getTokenContractAddress());

        this.miningLogger = miningLogger;
        this.vault = vault;




    },

    async mine(subsystem_command,subsystem_option)
    {

      console.log('\n')

      //miningParameters


      if(this.miningStyle == "solo")
      {
          //if solo mining need a full account
          var eth_account  = this.vault.getFullAccount();


          if( eth_account.accountType == "readOnly" ||  eth_account.privateKey == null || typeof eth_account.privateKey == 'undefined ' )
          {
            console.log('The account ',  eth_account.address, ' does not have an associated private key.  Please select another account or mine to a pool.');
            console.log('\n')
            return;
          }

      }else if( this.miningStyle == "pool" )
      {
        var eth_account  = this.vault.getAccount();
      }


      if (eth_account ==  null || eth_account.address == null) {
          console.log("Please create a new account with 'account new' before solo mining.")
          console.log('\n')
          return false;
      }else{
        console.log('Selected mining account:',  '\n',eth_account.address );
        console.log('\n')
      }

      ///this.mining = true;
      var self = this;
      this.minerEthAddress = eth_account.address;



       let miningParameters = {};
       await self.collectMiningParameters(this.minerEthAddress, miningParameters,self.miningStyle);

      this.miningLogger.appendToStandardLog("Begin mining for " + this.minerEthAddress + " @ gasprice " + this.vault.getGasPriceGwei());

      console.log("Mining for  "+ this.minerEthAddress);

      if(this.miningStyle != "pool")
      {
        console.log("Gas price is "+ this.vault.getGasPriceGwei() + ' gwei');
      }

      setInterval(() => { self.printMiningStats() }, PRINT_STATS_TIMEOUT);


    },

     mineStuff(miningParameters) {
        if (!this.mining) {

            this.mineCoins(this.web3, miningParameters,  this.minerEthAddress);
        }
    },

    setMiningStyle(style)
    {
        this.miningStyle = style;
    },


    async collectMiningParameters(minerEthAddress,miningParameters,miningStyle)
    {

  //    console.log('collect parameters.. ')
      var self = this;

      try
      {
          if(miningStyle === "pool")
          {

            var parameters = await this.networkInterface.collectMiningParameters(minerEthAddress,miningParameters);

          }else{

            var parameters = await this.networkInterface.collectMiningParameters();

          }

          //console.log('collected mining params ', parameters)
          miningParameters.miningDifficulty = parameters.miningDifficulty;
          miningParameters.challengeNumber = parameters.challengeNumber;
          miningParameters.miningTarget = parameters.miningTarget;
          miningParameters.poolEthAddress = parameters.poolEthAddress;

          //give data to the c++ addon


          await this.updateCPUAddonParameters(miningParameters,miningStyle)

    }catch(e)
    {
      console.log(e)
    }


      //keep on looping!
        setTimeout(function(){self.collectMiningParameters(minerEthAddress,miningParameters,self.miningStyle)},COLLECT_MINING_PARAMS_TIMEOUT);
    },

    async updateCPUAddonParameters(miningParameters,miningStyle){



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
                     this.mineStuff(miningParameters);

                   }catch(e)
                   {
                     console.log(e)
                   }


               }


    },

    ///refactor
  /*

   async collectDataFromContract(contractData)
    {
        try {
            const miningDifficultyString = await tokenContract.methods.getMiningDifficulty().call();
            const miningDifficulty = parseInt(miningDifficultyString);

            const miningTargetString = await tokenContract.methods.getMiningTarget().call();
            const miningTarget = web3utils.toBN(miningTargetString)

            const challengeNumber = await tokenContract.methods.getChallengeNumber().call();

            let bResume = false;

            if (!contractData.challengeNumber || contractData.challengeNumber != challengeNumber) {
                console.log("New challenge number: " + challengeNumber);
                CPUMiner.setChallengeNumber(challengeNumber);
                bResume = true;
            }
            if (!contractData.miningTarget || contractData.miningTarget.cmp(miningTarget) != 0) {
                console.log("New mining target: 0x" + miningTarget.toString(16));
                CPUMiner.setDifficultyTarget("0x" + miningTarget.toString(16));
            }
            if (!contractData.miningDifficulty || contractData.miningDifficulty != miningDifficulty) {
                console.log("New difficulty: " + miningDifficulty);
            }

            contractData.challengeNumber = challengeNumber;
            contractData.miningTarget = miningTarget;
            contractData.miningDifficulty = miningDifficulty;

            if (bResume && !this.mining) {
                console.log("Resuming mining operations with new challenge");
                this.mineStuff(contractData);
            }

        } catch (e) {
            console.error("cannot retrieve contract info", e);
        }
        return contractData;
    },

    */

    async submitNewMinedBlock( addressFrom, minerEthAddress, solution_number,digest_bytes,challenge_number, target, difficulty)

    //async submitNewMinedBlock(addressFrom, solution_number, digest_bytes, challenge_number)
    {
        this.miningLogger.appendToStandardLog("Giving mined solution to network interface " + challenge_number);

        this.networkInterface.queueMiningSolution(addressFrom, minerEthAddress, solution_number , digest_bytes , challenge_number, target, difficulty)
    },

    // contractData , -> miningParameters
      mineCoins(web3, miningParameters, minerEthAddress)
    {


      var target = miningParameters.miningTarget;
      var difficulty = miningParameters.miningDifficulty;


      var addressFrom;

      if( this.miningStyle == "pool" ){
          addressFrom = miningParameters.poolEthAddress;
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

    printMiningStats()
    {

      var hashes = CPUMiner.hashes();
      console.log('hashes:', hashes )
        console.log('Hash rate: ' + parseInt( hashes / PRINT_STATS_TIMEOUT) + " kH/s");
    }

}
