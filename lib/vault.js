

/*
  Every time the software is booted, the vault password
  must be provided to unlock the encrypted private key store


*/

  var LocalStorage = require('node-localstorage').LocalStorage;

  const fs   = require('fs');
  const path = require('path');

var mkdirp = require('mkdirp');

  var vaultData = {};

module.exports =  {


    init()
    {
      this.isUnlocked = false ;


      mkdirp(this.get0xBitcoinLocalFolderPath(), function (err) {
          if (err) console.error(err)
          else console.log(this.getOSLocalDataFolderPath())
      }.bind(this));


        localStorage = new LocalStorage(this.get0xBitcoinLocalFolderPath()+'/0xbtcminerstore');


        localStorage.setItem('myFirstKey', 'myFirstValue')
        console.log(localStorage.getItem('myFirstKey'))
    },

    get0xBitcoinLocalFolderPath()
    {
      return this.getOSLocalDataFolderPath()  + '/.0xbitcoin';
    },

    getOSLocalDataFolderPath()
    {
        return (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : process.env.HOME))

    },

    createAccount()
    {
        account = web3.eth.accounts.create( );


          //need to save a primary account id

          //need to save and load an encrypted JSON object

        //will be required to enter a password for encrypting the kystore !!

    },

    getAccount()
    {

      if( this.encryptedStoreExists() )
      {

        //ask for password  with AWAIT


      }

      return {
        public_address: '0x2B63dB710e35b0C4261b1Aa4fAe441276bfeb971',
        private_key: 'a6c4ca8fdbb9bf6c4424832fe970c034282a3a8ae31339b7b5c64478dbebf366'
      }

    },

    encryptedStoreExists()
    {
      //check if file exists

    },



    loadEncryptedStore(passphrase)
    {
      //vaultData


    },

    saveEncryptedStore()
    {



    },




}
