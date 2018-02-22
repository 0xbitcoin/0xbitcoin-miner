var web3utils =  require('web3-utils');
var solidityHelper = require('./solidity-helper')
var leftpad =  require('leftpad');

const BN = require('bn.js');

var tokenContractJSON = require('./contracts/_0xBitcoinToken.json');

const CPUMiner = require('./build/Release/cpuminer');
const GPUMiner = require('./build/Release/gpuminer');

var tokenContract;

const PRINT_STATS_TIMEOUT = 5000;
const COLLECT_MINING_PARAMS_TIMEOUT = 2000;


module.exports =  {

    async init(web3,  vault, miningLogger)
  //  async init(web3, subsystem_command, vault, networkInterface, miningLogger)
    {

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



      //miningParameters

      var eth_account  = this.vault.getAccount();
      console.log('Selected mining account:', eth_account);

      if (eth_account ==  null || eth_account.address == null) {
          console.log("Please create a new account with 'account new' before mining.")
          return false;
      }

      this.mining = true; // to prevent start of mining in collectDataFromContract() before end of func
      var self = this;
      var minerEthAddress = eth_account.address;



      let miningParameters = {};
      setInterval(function(){self.collectMiningParameters(minerEthAddress,miningParameters,self.miningStyle)},COLLECT_MINING_PARAMS_TIMEOUT);
      await self.collectMiningParameters(minerEthAddress, miningParameters,self.miningStyle);


      this.mineStuff = function(miningParameters) {
          if (!this.mining) {
          //  if (this.mining) {
              this.mineCoins(self.web3, miningParameters,  minerEthAddress);
          }
      }

      //await self.collectDataFromContract(contractData);
      //setInterval(() => {self.collectDataFromContract(contractData)}, COLLECT_CONTRACT_DATA_TIMEOUT);

      this.miningLogger.appendToStandardLog("Begin mining for " + minerEthAddress + " @ gasprice " + this.vault.getGasPriceGwei());

      console.log("Mining for  "+ minerEthAddress);
      console.log("Gas price is "+ this.vault.getGasPriceGwei() + ' gwei');
      // console.log("Configured CPU threadcount is "+ vault.getNumThreads() ) // not used

      setInterval(() => { self.printMiningStats() }, PRINT_STATS_TIMEOUT);

      // let's mine!
      this.mining = false;
      this.mineStuff(miningParameters);
    },

    setMiningStyle(style)
    {
        this.miningStyle = style;
    },


    async collectMiningParameters(minerEthAddress,miningParameters,miningStyle)
    {

      let bResume = false;

      if(miningStyle === "pool")
      {

        var parameters = await this.networkInterface.collectMiningParameters(minerEthAddress);


      }else{

        var parameters = await this.networkInterface.collectMiningParameters();

      }

      //console.log('collected mining params ', parameters)
      miningParameters.miningDifficulty = parameters.miningDifficulty;
      miningParameters.challengeNumber = parameters.challengeNumber;
      miningParameters.miningTarget = parameters.miningTarget;
      miningParameters.poolEthAddress = parameters.poolEthAddress;

      //give data to the c++ addon


      this.updateCPUAddonParameters(miningParameters)
    },

    async updateCPUAddonParameters(miningParameters){

      var challengeNumber = miningParameters.challengeNumber
        var miningTarget = miningParameters.miningTarget
        var miningDifficulty = miningParameters.miningDifficulty

              console.log("New challenge number: " + challengeNumber);
              CPUMiner.setChallengeNumber(challengeNumber);
              bResume = true;

               console.log("New mining target: 0x" + miningTarget.toString(16));
               CPUMiner.setDifficultyTarget("0x" + miningTarget.toString(16));

               console.log("New difficulty: " + miningDifficulty);

               /*
               if (bResume && !this.mining) {
                   console.log("Resuming mining operations with new challenge");
                   this.mineStuff(contractData);
               }
               */

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

        this.networkInterface.queueMiningSolution(addressFrom, solution_number , digest_bytes , challenge_number)
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
            const digest = web3utils.sha3(challenge_number + minerEthAddress.substring(2) + solution_number.substring(2));
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
        CPUMiner.run( (err, sol) => {
            if (sol) {
                console.log("Solution found!");
                verifyAndSubmit(sol);
            }
            console.log("Stopping mining operations for the moment...");
            self.mining = false;
        });
    },


    setNetworkInterface(netInterface)
    {
        this.networkInterface = netInterface;
    },

    printMiningStats()
    {
        console.log('Hash rate: ' + parseInt(CPUMiner.hashes() / PRINT_STATS_TIMEOUT) + " kH/s");
    }

}
