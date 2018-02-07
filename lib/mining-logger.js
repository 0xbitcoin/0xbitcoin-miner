

var logStorage;

var errorLog;

var stdLog;

module.exports =  {

  init()
  {
    logStorage = new LocalStorage(vault.get0xBitcoinLocalFolderPath()+'/logs');

    errorLog = JSON.parse(logStorage.getItem('error') )  ;
    stdLog = JSON.parse(logStorage.getItem('stdout') )  ;
  }


  appendToStandardLog(s)
  {
    stdLog += getDateTime()
    stdLog += s
    stdLog += '\n';
    saveLogs()
  }


  appendToErrorLog(s)
  {
    errorLog += getDateTime()
    errorLog += s
    errorLog += '\n';
    saveLogs()
  }

  saveLogs()
  {

    logStorage.setItem('stdout',JSON.stringify(stdLog));
    logStorage.setItem('error',JSON.stringify(errorLog));

  }


  function getDateTime() {

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
