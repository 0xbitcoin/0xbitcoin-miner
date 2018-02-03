//var sha3_256 = require('js-sha3').sha3_256;

var web3utils =  require('web3-utils');

var solidityHelper = require('./solidity-helper')

var leftpad =  require('leftpad');

var miningDifficulty = 4;
var challengeNumber = 'aaa';

var tokenContract;


// 164892630 '00004fd994cbd58363bdfe0809d1a6d58e1646b56d1bb59154e45d555a6615aa'



module.exports =  {



    async init(web3, contract, vault, networkInterface)
    {
      tokenContract = contract;

      this.networkInterface = networkInterface;

      this.vault=vault;

      var eth_account_address = vault.getAccount().public_address;

      var mining=true;
      this.triesThisCycle = 0;


      setInterval(function(){ this.printMiningStats()}.bind(this), 5000)

        var index = 0;

        var self = this;

        var difficulty = miningDifficulty;
        var latestMiningBlockHash = challengeNumber;
        var minerEthAddress = eth_account_address;

       function mineStuff(){
         //console.log('mine stuff')



            if( mining){
              self.mineCoins(web3, latestMiningBlockHash,minerEthAddress,difficulty )
              self.triesThisCycle+=1;

              index++;
              setTimeout(mineStuff,0)
            }
        }

        setTimeout(self.collectDataFromContract,10000);
        await self.collectDataFromContract();

        console.log("Mining for  "+ eth_account_address)
        mineStuff();



    },

    async collectDataFromContract()
    {


      console.log('collecting data from smartcontract');
    //  miningDifficulty = 4;
    //  challengeNumber = 'aaa';



      var diff = await tokenContract.methods.getMiningDifficulty().call() ;
      miningDifficulty = parseInt(diff);

      var chall = await tokenContract.methods.getChallengeNumber().call() ;
      challengeNumber = chall;

      console.log('difficulty:', miningDifficulty);
      console.log('challenge number:', challengeNumber)

    },

    async submitNewMinedBlock( addressFrom, nonce,digest_bytes)
    {
       console.log('Submitting block for reward')
       console.log(nonce,digest_bytes)




       this.networkInterface.submitMiningSolution( addressFrom, nonce , digest_bytes ,
         function(result){
          console.log('submit mining soln:' , error,result)
        })


        /*
      tokenContract.methods.mint(nonce,digest_bytes).send({}, function(error,result){
         console.log(error,result)
       } ) ;
       */
      //  console.log('success',success)


    },



    /*
    The challenge word will be...

    //we have to find the latest mining hash by asking the contract

    sha3( latestMiningBlockHash , minerEthAddress , nonce )


    */
    mineCoins(web3, latestMiningBlockHash,minerEthAddress,difficulty)
    {
        //may need a second nonce !!

               var nonce = this.getRandomInt(Math.pow(2,32))  //nonce like bitcoin

                var digest =  web3utils.soliditySha3( latestMiningBlockHash , minerEthAddress, nonce )


                if(digest.startsWith('0x')) //3078 is 0x
                {
                   var trimmedDigest = digest.substring(2);
                }else {
                  var trimmedDigest = digest;
                }

            var digestBytes32 = solidityHelper.stringToSolidityBytes32(trimmedDigest);


            // digestBytes32 is 64 characters, 32 bytes.  Every 2 characters is a byte!

                var zeroesCount = this.countZeroCharactersInFront(digestBytes32)

              //  console.log(trimmedDigestBytes32)
 

                   if ( zeroesCount >= 2 )
                   {
                       console.log(zeroesCount)
                   }

               if ( zeroesCount >= difficulty )
               {
                 //pass in digest bytes or trimmed ?
                this.submitNewMinedBlock( minerEthAddress, nonce, digestBytes32);

               }


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
