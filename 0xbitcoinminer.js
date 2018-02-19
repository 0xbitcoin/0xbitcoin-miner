
var web3utils =  require('web3-utils');

var solidityHelper = require('./solidity-helper')

var leftpad =  require('leftpad');



const BN = require('bn.js');

var tokenContractJSON = require('./contracts/_0xBitcoinToken.json');


var tokenContract;



const GPUMiner = require('./build/Release/addon');



module.exports =  {



    async init(web3,  subsystem_command, vault, networkInterface, miningLogger)
    {


      tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,vault.getTokenContractAddress())

      this.miningLogger = miningLogger;

      this.networkInterface = networkInterface;

      this.vault=vault;

      this.testMode = (subsystem_command === 'test');
      this.debugMode = (subsystem_command === 'debug');



      var eth_account  = vault.getAccount();

      console.log('Selected mining account:', eth_account )


      if( eth_account ==  null || eth_account.address == null )
      {
        console.log("Please create a new account with 'account new' before mining.")
        return false;
      }

      this.mining=true;
      this.triesThisCycle = 0;


      setInterval(function(){ this.printMiningStats()}.bind(this), 5000)

        var index = 0;

        var self = this;


        var minerEthAddress = eth_account.address;

        let contractData = {}; //passed around as a reference and edited globally

        await self.collectDataFromContract(contractData);

       function mineStuff(contractData){
         //console.log('mine stuff')


            if( self.mining){
              self.mineCoins(web3, contractData,minerEthAddress )
              self.triesThisCycle+=1;

              index++;
              setTimeout(function(){mineStuff(contractData)},0)
            }
        }

        setInterval(function(){self.collectDataFromContract(contractData)},2000);

        this.miningLogger.appendToStandardLog("Begin mining for " + minerEthAddress + " gasprice " + vault.getGasPriceGwei() + " threads " + vault.getNumThreads())


        console.log("Mining for  "+ minerEthAddress)
        console.log("Gas price is "+ vault.getGasPriceGwei() + ' gwei')
        console.log("Configured CPU threadcount is "+ vault.getNumThreads() )
        console.log("contractData Target  "+ contractData.miningTarget)

        var threads = vault.getNumThreads();

        for(var i=0;i<threads;i++)
        {
          mineStuff( contractData );
        }




    },

    async collectDataFromContract(contractData)
    {


      var miningDifficultyString = await tokenContract.methods.getMiningDifficulty().call()  ;
      var miningDifficulty = parseInt(miningDifficultyString)

      var miningTargetString = await tokenContract.methods.getMiningTarget().call()  ;
      var miningTarget = web3utils.toBN(miningTargetString)

      var challengeNumber = await tokenContract.methods.getChallengeNumber().call() ;


      console.log('Mining difficulty:', miningDifficulty);
      //console.log('target:', miningTarget);
      console.log('Challenge number:', challengeNumber)

      contractData.miningDifficulty= miningDifficulty;
        contractData.challengeNumber= challengeNumber;
        contractData.miningTarget= miningTarget;


      return contractData;

    },

    async submitNewMinedBlock( addressFrom, solution_number,digest_bytes,challenge_number)
    {
       this.miningLogger.appendToStandardLog("Giving mined solution to network interface " + challenge_number)

       this.networkInterface.queueMiningSolution( addressFrom, solution_number , digest_bytes , challenge_number)
    },



    /*
    The challenge word will be...

    //we have to find the latest mining hash by asking the contract

    sha3( challenge_number , minerEthAddress , solution_number )


    */
    mineCoins(web3, contractData , minerEthAddress)
    {

               var solution_number = web3utils.randomHex(32)  //solution_number like bitcoin

               var challenge_number = contractData.challengeNumber;
               var target = contractData.miningTarget;

                var digest =  web3utils.soliditySha3( challenge_number , minerEthAddress, solution_number )


              //  console.log(web3utils.hexToBytes('0x0'))
              var digestBytes32 = web3utils.hexToBytes(digest)
                var digestBigNumber = web3utils.toBN(digest)

                var miningTarget = web3utils.toBN(target) ;



              //  console.log('digestBigNumber',digestBigNumber.toString())
                // console.log('miningTarget',miningTarget.toString())

               if ( digestBigNumber.lt(miningTarget)  )
               {

                  if(this.testMode){
                    console.log(minerEthAddress)
                    console.log('------')
                    console.log(solution_number)
                    console.log(challenge_number)
                    console.log(solution_number)
                    console.log('------')
                    console.log( web3utils.bytesToHex(digestBytes32))

                 //pass in digest bytes or trimmed ?


                   this.mining = false;

                   this.networkInterface.checkMiningSolution( minerEthAddress, solution_number , web3utils.bytesToHex( digestBytes32 ),challenge_number,miningTarget,
                     function(result){
                      console.log('checked mining soln:' ,result)
                    })
                }else {
                  console.log('submit mined solution with challenge ', challenge_number)


                  this.submitNewMinedBlock( minerEthAddress, solution_number,   web3utils.bytesToHex( digestBytes32 ) , challenge_number);
                }
               }


    },

    countZeroBytesInFront(array)
    {
      var zero_char_code = '30'

      var char;
      var count = 0;
      var length = array.length;

      for(var i=0;i<array.length;i+=1)
      {
        if(array[i] === 0)
        {
          count++;
        }else{
          break
        }
      }

      return count;

    },

    countZeroCharactersInFront(s)
    {
      var zero_char_code = '30'

      var char;
      var count = 0;
      var length = s.length;

      for(var i=0;i<s.length;i+=2)
      {
        if(s.substring(i,i+2) === zero_char_code)
        {
          count++;
        }else{
          break
        }
      }

      return count;

    },


    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    },

    printMiningStats()
    {
      console.log('Hash rate:',  this.triesThisCycle / 5);
      this.triesThisCycle = 0;
    }


}
