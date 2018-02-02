

var leftpad =  require('leftpad');
var web3utils =  require('web3-utils');

module.exports =  {


stringToSolidityBytes32(string)
{
  var result = "0x";
  var i = 0;

  for(i=0;i<32;i++)
  {
    if(string.length > i)
    {
      result += string.charCodeAt(i).toString(16)
    }else {
      result += "00"
    }
  }


  return result;
},

//0x6161000000000000000000000000000000000000000000000000000000000000 -> aa
solidityBytes32ToString(bytes32)
{
  var result = "";
  var i = 0;

  if(bytes32.startsWith('0x'))
  {
    var rawcodes = bytes32.substring(2);
  }else{
    var rawcodes = bytes32;
  }

  for(i=0;i<32;i++)
  {
    var segment = rawcodes.substring(i*2,i*2+2)
    var segment_value = parseInt(segment,16)
    if(segment_value != '00')
    {
      result += String.fromCharCode(segment_value)
    }
  }


  return result;
},

solidityKeccak256(...args) {
 args = args.map(arg => {
   if (typeof arg === 'string') {
     if (arg.substring(0, 2) === '0x') {
         return arg.slice(2)
     } else {
         return web3utils.toHex(arg).slice(2)
     }
   }

   if (typeof arg === 'number') {
           if (arg < 0) {
             return leftpad((arg >>> 0).toString(16), 64, 'F');
           }
           return leftpad((arg).toString(16), 64, 0);
       }
 })

 args = args.join('')

 return web3utils.sha3(args, { encoding: 'hex' })
}



}
