//var sha3_256 = require('js-sha3').sha3_256;

var web3utils =  require('web3-utils');

var solidityHelper = require('./solidity-helper')

var leftpad =  require('leftpad');

var miningDifficulty = 4;
var challengeNumber = 'aaa';

var tokenContract;


// 164892630 '00004fd994cbd58363bdfe0809d1a6d58e1646b56d1bb59154e45d555a6615aa'



module.exports =  {



    async init(web3, contract, eth_account)
    {
      tokenContract = contract;

      var mining=true;
      this.triesThisCycle = 0;


      setInterval(function(){ this.printMiningStats()}.bind(this), 5000)

        var index = 0;

        var self = this;

        var difficulty = miningDifficulty;
        var latestMiningBlockHash = challengeNumber;
        var minerEthAddress = eth_account;

       function mineStuff(){
         //console.log('mine stuff')



            if( mining){
              self.mineCoins( latestMiningBlockHash,minerEthAddress,difficulty )
              self.triesThisCycle+=1;

              index++;
              setTimeout(mineStuff,0)
            }
        }

        setTimeout(self.collectDataFromContract,10000);
        await self.collectDataFromContract();

        console.log("Mining for  "+ eth_account)
        mineStuff();



    },

    async collectDataFromContract()
    {


      console.log('collecting data from smartcontract');
    //  miningDifficulty = 4;
    //  challengeNumber = 'aaa';


      var diff = await tokenContract.methods.getMiningDifficulty().call({} ) ;
      miningDifficulty = parseInt(diff);

      var chall = await tokenContract.methods.getChallengeNumber().call({} ) ;
      challengeNumber = chall;

      console.log('difficulty:', miningDifficulty);
      console.log('challenge number:', challengeNumber)

    },

    async submitNewMinedBlock(nonce,digest_bytes)
    {
       console.log('Submitting block for reward')
       console.log(nonce,digest_bytes)



      tokenContract.methods.mint(nonce,digest_bytes).send({}, function(error,result){
         console.log(error,result)
       } ) ;
      //  console.log('success',success)


    },



    /*
    The challenge word will be...

    //we have to find the latest mining hash by asking the contract

    sha3( latestMiningBlockHash , minerEthAddress , nonce )


    */
    mineCoins(latestMiningBlockHash,minerEthAddress,difficulty)
    {
        //may need a second nonce !!

               var nonce = this.getRandomInt(Math.pow(2,32))  //nonce like bitcoin

                var digest =  web3utils.soliditySha3( latestMiningBlockHash , minerEthAddress, nonce )

               if(digest.startsWith('0x'))
               {
                  digest = digest.substring(2);
               }

                var zeroesCount = this.countZeroesInFront(digest)
               if ( zeroesCount >= difficulty )
               {



                this.submitNewMinedBlock(nonce,solidityHelper.stringToSolidityBytes32(digest));

               }


    },

    countZeroesInFront(s)
    {
      var char;
      var count = 0;
      var length = s.length;

      for(var i=0;i<s.length;i++)
      {
        if(s[i] === '0')
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
