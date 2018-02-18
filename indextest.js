
const GPUMiner = require('./build/Release/addon');


console.log('diff target' ,GPUMiner.setDifficultyTarget(1000));
console.log('challenge number',GPUMiner.setChallengeNumber(2000));
// Prints: 'world'
