//var sha3_256 = require('js-sha3').sha3_256;

var web3utils =  require('web3-utils');

var solidityHelper = require('./solidity-helper')

var leftpad =  require('leftpad');

//var miningDifficulty = 4;
//var challengeNumber = 'aaa';

var tokenContract;


// 164892630 '00004fd994cbd58363bdfe0809d1a6d58e1646b56d1bb59154e45d555a6615aa'



module.exports =  {



    async init(web3, contract, vault, networkInterface)
    {
      tokenContract = contract;

      this.networkInterface = networkInterface;

      this.vault=vault;

      var eth_account_address = vault.getAccount().public_address;

       this.mining=true;
      this.triesThisCycle = 0;


      setInterval(function(){ this.printMiningStats()}.bind(this), 5000)

        var index = 0;

        var self = this;

        //var difficulty = miningDifficulty;
      //  var latestMiningBlockHash = challengeNumber;
        var minerEthAddress = eth_account_address;

       function mineStuff(contractData){
         //console.log('mine stuff')



            if( self.mining){
              self.mineCoins(web3, contractData.challengeNumber,minerEthAddress,contractData.miningDifficulty )
              self.triesThisCycle+=1;

              index++;
              setTimeout(function(){mineStuff(contractData)},0)
            }
        }

        setTimeout(self.collectDataFromContract,10000);
        collectedContractData = await self.collectDataFromContract();

        console.log("Mining for  "+ eth_account_address)
        mineStuff( collectedContractData );



    },

    async collectDataFromContract()
    {


      console.log('collecting data from smartcontract');



      var miningDifficultyString = await tokenContract.methods.getMiningDifficulty().call()  ;
      var miningDifficulty = parseInt(miningDifficultyString)

      var challengeNumber = await tokenContract.methods.getChallengeNumber().call() ;


      console.log('difficulty:', miningDifficulty);
      console.log('challenge number:', challengeNumber)

      return {
        miningDifficulty: miningDifficulty,
        challengeNumber: challengeNumber
      }

    },

    async submitNewMinedBlock( addressFrom, solution_number,digest_bytes)
    {
       console.log('Submitting block for reward')
       console.log(solution_number,digest_bytes)

    /*   this.networkInterface.checkMiningSolution( addressFrom, solution_number , digest_bytes ,
         function(result){
          console.log('submit mining soln:' , error,result)
        })
*/

      this.networkInterface.submitMiningSolution( addressFrom, solution_number , digest_bytes ,
         function(result){
          console.log('submit mining soln:' , error,result)
        })

        /*
      tokenContract.methods.mint(solution_number,digest_bytes).send({}, function(error,result){
         console.log(error,result)
       } ) ;
       */
      //  console.log('success',success)


    },



    /*
    The challenge word will be...

    //we have to find the latest mining hash by asking the contract

    sha3( latestMiningBlockHash , minerEthAddress , solution_number )


    */
    mineCoins(web3, latestMiningBlockHash,minerEthAddress,difficulty)
    {
        //may need a second solution_number !!

               var solution_number = this.getRandomInt(Math.pow(2,32))  //solution_number like bitcoin

                var digest =  web3utils.soliditySha3( latestMiningBlockHash , minerEthAddress, solution_number )


              //  console.log(web3utils.hexToBytes('0x0'))
              var digestBytes32 = web3utils.hexToBytes(digest)

            //  console.log('digestBytes32',digestBytes32);

          //  var digestBytes32 = solidityHelper.stringToSolidityBytes32(digest);


            // digestBytes32 is 64 characters, 32 bytes.  Every 2 characters is a byte!

                var zeroesCount = this.countZeroBytesInFront(digestBytes32)

              //  console.log(trimmedDigestBytes32)


                   if ( zeroesCount >= 2 )
                   {
                       console.log(zeroesCount)
                       console.log('------')
                        console.log(latestMiningBlockHash)
                         console.log(minerEthAddress)
                          console.log(solution_number)
                      console.log('------')
                       console.log( web3utils.bytesToHex(digestBytes32))
                   }

               if ( zeroesCount >= difficulty && !this.foundSolution )
               {
                 //pass in digest bytes or trimmed ?
                 this.mining = false;
                this.submitNewMinedBlock( minerEthAddress, solution_number,   web3utils.bytesToHex( digestBytes32 ) );

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
