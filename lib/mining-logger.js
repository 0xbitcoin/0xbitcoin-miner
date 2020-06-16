


  var LocalStorage = require('node-localstorage').LocalStorage;


    const fs   = require('fs');
    const path = require('path');


var logStorage;

var errorLog = [];

var stdLog = [];

module.exports =  {

  init( )
  {
    logStorage = new LocalStorage(this.get0xBitcoinLocalFolderPath()  );
    logStorage = new LocalStorage(this.get0xBitcoinLocalFolderPath()+'/logs');

    if(this.logsExist())
    {
      errorLog = JSON.parse(logStorage.getItem('error') )  ;
      stdLog = JSON.parse(logStorage.getItem('stdout') )  ;
    }





    this.saveLogs();
  },

  get0xBitcoinLocalFolderPath()
  {
    return this.getOSLocalDataFolderPath()  + '/.0xbitcoin';
  },

  getOSLocalDataFolderPath()
  {
      return (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME))

  },

  logsExist()
  {
    if (!fs.existsSync(this.get0xBitcoinLocalFolderPath()) || !fs.existsSync(this.get0xBitcoinLocalFolderPath() +'/logs' )  ){
      return false;
    }

    if (!fs.existsSync(this.get0xBitcoinLocalFolderPath()+'/logs/stdout' ) ){
      return false;
    }

    return true;
  },

  appendToStandardLog(s)
  {


    if(stdLog.length > 1000)
    {
      stdLog = []
    }

    var newline = ""
    newline += this.getDateTime()
    newline += s
    newline += '\\n';

    stdLog.push(newline)
    this.saveLogs();
  },


  appendToErrorLog(s)
  {

    if(errorLog.length > 1000)
    {
      errorLog = []
    }


    var newline = ""
    newline += this.getDateTime()
    newline += s
    newline += '\\n';

    errorLog.push(newline)
    this.saveLogs();
  },

  saveLogs()
  {

    try{
      logStorage.setItem('stdout',JSON.stringify(stdLog));
      logStorage.setItem('error',JSON.stringify(errorLog));
    } catch(e)
    {
      console.log('logging save error ',e)
    }
  },


   getDateTime() {

      var date = new Date();

      var hour = date.getHours();
      hour = (hour < 10 ? "0" : "") + hour;

      var min  = date.getMinutes();
      min = (min < 10 ? "0" : "") + min;

      var sec  = date.getSeconds();
      sec = (sec < 10 ? "0" : "") + sec;

      var year = date.getFullYear();

      var month = date.getMonth() + 1;
      month = (month < 10 ? "0" : "") + month;

      var day  = date.getDate();
      day = (day < 10 ? "0" : "") + day;

      return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

  }



}
