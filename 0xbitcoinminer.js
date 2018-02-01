//var sha3_256 = require('js-sha3').sha3_256;

var web3utils =  require('web3-utils');


var leftpad =  require('leftpad');

module.exports =  {



    init(difficuly)
    {

      console.log('starting ')
      var mining=true;
      this.triesThisCycle = 0;


      setInterval(function(){ this.printMiningStats()}.bind(this), 5000)

        var index = 0;

        var self = this;
        var latestMiningBlockHash = '0x1234'
        var minerEthAddress = '0x5678'

       function mineStuff(){
         //console.log('mine stuff')

            if( mining){
              self.mineCoins( latestMiningBlockHash,minerEthAddress,difficuly )
              self.triesThisCycle+=1;

              index++;
              setTimeout(mineStuff,0)
            }
        }

        mineStuff();



    },

     keccak256(...args) {
      args = args.map(arg => {
        if (typeof arg === 'string') {
          if (arg.substring(0, 2) === '0x') {
              return arg.slice(2)
          } else {
              return web3utils.toHex(arg).slice(2)
          }
        }

        if (typeof arg === 'number') {
          return leftpad((arg).toString(16), 64, 0)
        } else {
          return ''
        }
      })

      args = args.join('')

      return web3utils.sha3(args, { encoding: 'hex' })
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

                 console.log('found a good one')

                 console.log(combinedResult,digest)
              //   this.mining=false;
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
