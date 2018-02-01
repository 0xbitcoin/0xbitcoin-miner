

const Miner = require("./0xbitcoinminer");

if (process.argv.length <= 2) {
console. log("Please add a difficulty parameter (1-64)");
process. exit(-1);
}

var difficulty = parseInt(process.argv[2]);

if(difficulty > 1)
{
  console.log("Mining with a difficuly of "+ difficulty)
   Miner.init(difficulty)
}
