
var web3utils =  require('web3-utils');

var solidityHelper = require('./solidity-helper')

var leftpad =  require('leftpad');



const BN = require('bn.js');

var tokenContractJSON = require('./contracts/_0xBitcoinToken.json');


var tokenContract;



const CPUMiner = require('./build/Release/cpuminer');
const GPUMiner = require('./build/Release/gpuminer');



module.exports =  {



    async init(web3,  vault, miningLogger)
    {

      tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,vault.getTokenContractAddress())

      this.web3 = web3;

      this.miningLogger = miningLogger;

      this.vault=vault;


      this.eth_account  = vault.getAccount();


      if( this.eth_account ==  null || this.eth_account.address == null )
      {
        console.log("Please create a new account with 'account new' before mining.")
        return false;
      }


    },




  setNetworkInterface(netInterface)
  {
      this.networkInterface = netInterface;
  },

  setMiningStyle(style)
  {
      this.miningStyle = style;
  },

  async mine(subsystem_command,subsystem_option){


      if( this.miningStyle == "pool" ){
        if( subsystem_command != "mine" ){
          return;
        }
      }

      console.log('\n' )
      console.log('Selected mining account:', this.eth_account )
      console.log('\n' )


      this.mining=true;
      this.triesThisCycle = 0;


      var minerEthAddress = this.eth_account.address;


      setInterval(function(){ this.printMiningStats()}.bind(this), 5000)



        var index = 0;

        var self = this;



        var ethAddress;


        let miningParameters = {}; //passed around as a reference and edited globally

        setInterval(function(){self.collectMiningParameters(minerEthAddress,miningParameters,self.miningStyle)},2000);

        await self.collectMiningParameters(minerEthAddress, miningParameters,self.miningStyle);

       function mineCycle(miningParameters){
         //console.log('mine stuff')


            if( self.mining){

              var addressFrom;

              if( self.miningStyle == "pool" ){
                  addressFrom = miningParameters.poolEthAddress;
              }else{
                  addressFrom = minerEthAddress;
              }


              self.mineCoins(this.web3, miningParameters, minerEthAddress , addressFrom)
              self.triesThisCycle+=1;

              index++;
              setTimeout(function(){mineCycle(miningParameters)},0)
            }
        }

        this.miningLogger.appendToStandardLog("Begin mining for " + minerEthAddress + " gasprice " + this.vault.getGasPriceGwei() + " threads " + this.vault.getNumThreads())


        setInterval(function(){
        console.log("Mining for  "+ minerEthAddress)
        console.log("Gas price is "+ self.vault.getGasPriceGwei() + ' gwei')
        console.log("Configured CPU threadcount is "+ self.vault.getNumThreads() )
        console.log("Mining Difficulty  "+ miningParameters.miningDifficulty)
        console.log("Difficulty Target  "+ miningParameters.miningTarget)
      },10000)

        var threads = this.vault.getNumThreads();

        for(var i=0;i<threads;i++)
        {
          mineCycle( miningParameters );
        }




    },

    async collectMiningParameters(minerEthAddress,miningParameters,miningStyle)
    {

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


    },

    async submitNewMinedBlock( addressFrom, minerEthAddress, solution_number,digest_bytes,challenge_number, target, difficulty)
    {
       this.miningLogger.appendToStandardLog("Giving mined solution to network interface " + challenge_number)

       this.networkInterface.queueMiningSolution( addressFrom, minerEthAddress, solution_number , digest_bytes , challenge_number, target, difficulty)
    },



    /*
    The challenge word will be...

    //we have to find the latest mining hash by asking the contract

    sha3( challenge_number , minerEthAddress , solution_number )


    */
    mineCoins(web3, miningParameters , minerEthAddress, addressFrom)
    {


               var solution_number = web3utils.randomHex(32)  //solution_number like bitcoin

               var challenge_number = miningParameters.challengeNumber;
               var target = miningParameters.miningTarget;
               var difficulty = miningParameters.miningDifficulty;

               var digest =  web3utils.soliditySha3( challenge_number , addressFrom, solution_number )


              //  console.log(web3utils.hexToBytes('0x0'))
               var digestBytes32 = web3utils.hexToBytes(digest)
               var digestBigNumber = web3utils.toBN(digest)

               var miningTarget = web3utils.toBN(target) ;



                //console.log('digestBigNumber',digestBigNumber.toString())
                 //console.log('miningTarget',miningTarget.toString())

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

                   /*this.networkInterface.checkMiningSolution( minerEthAddress, solution_number , web3utils.bytesToHex( digestBytes32 ),challenge_number,miningTarget,
                     function(result){
                      console.log('checked mining soln:' ,result)
                    })*/


                  }else {
                    console.log('submit mined solution with challenge ', challenge_number)

                    this.submitNewMinedBlock( addressFrom, minerEthAddress, solution_number,   web3utils.bytesToHex( digestBytes32 ) , challenge_number, target, difficulty );
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
