/*

In order to test basic GPU mining functions


Compile the C++ addon with
>>>> npm run build              (this calls binding.gyp)


Run this file with
>>>> node indextestgpu.js


*/

//import C++ GPU miner code --  /cpp/gpuminer.cc
const GPUMiner = require('./build/Release/gpumineraddonsimple');

//send data into the miner
console.log('diff target' ,GPUMiner.setDifficultyTarget(5841053340));
console.log('challenge number',GPUMiner.setChallengeNumber(2000));

console.log('random number',GPUMiner.getRandomNumber());


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
