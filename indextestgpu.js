/*

In order to test basic GPU mining functions


Compile the C++ addon with
>>>> npm run build              (this calls binding.gyp)


Run this file with
>>>> node indextestgpu.js


*/

var web3utils =  require('web3-utils');


//import C++ GPU miner code --  /cpp/gpuminer.cc
//const GPUMiner = require('./build/Release/gpuminer-addon-alpha');
const GPUMiner = require('./build/Release/gpuminer_addon_alpha');


var testNonce = 5566
var difficultyTarget = 5841053340
var challengeNumber = 2000
var ethAddress = '0x1234'

//send data into the miner
console.log('diff target' ,GPUMiner.setDifficultyTarget(difficultyTarget));
console.log('challenge number',GPUMiner.setChallengeNumber(challengeNumber));
console.log('eth address',GPUMiner.setEthAddress(ethAddress));

console.log('random number',GPUMiner.getRandomNumber());


console.log('keccak hash should be ', web3utils.soliditySha3(testNonce,ethAddress,challengeNumber) , GPUMiner.getKeccak256(testNonce,ethAddress,challengeNumber));


//start the infinite mining loop which is in c++


setInterval(function(){
  console.log('asking GPU process for solutions...')
  var gpu_solutions = GPUMiner.getSolutionsBuffer()
  console.log(gpu_solutions);

  var gpu_solutions = GPUMiner.clearSolutionsBuffer()
},2000)

setTimeout(function(){
  var response = GPUMiner.startMining()
  console.log(response)

},0)


/*

This code will eventually be moved into the file '0xbitcoinminer.js'

*/
