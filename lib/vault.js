

/*
  Every time the software is booted, the vault password
  must be provided to unlock the encrypted private key store


*/

  var LocalStorage = require('node-localstorage').LocalStorage;



  var web3Utils = require('web3-utils')

  const fs   = require('fs');
  const path = require('path');

  var Cryptr = require('cryptr');
  var cryptr;

var mkdirp = require('mkdirp');
var prompt = require('prompt');

  var vaultData = {};

  var userPassword;

module.exports =  {


    async init(web3)
    {

      this.web3 = web3;
      this.isUnlocked = false ;

       if( !this.encryptedStorageExists() )
      {

         userPassword = await this.askUserPassword(false);

         while( userPassword.length < 8 )
         {
           console.log('Please create a password that is at least 8 characters in length.')
           userPassword = await this.askUserPassword(true);
         }

        mkdirp(this.get0xBitcoinLocalFolderPath(), function (err) {
            if (err) console.error(err)
            else console.log('created new encrypted keystore file at ' + this.getOSLocalDataFolderPath())
        }.bind(this));

        localStorage = new LocalStorage(this.get0xBitcoinLocalFolderPath()+'/0xbtcminerstore');


      }else{

        userPassword = await this.askUserPassword(true);

        localStorage = new LocalStorage(this.get0xBitcoinLocalFolderPath()+'/0xbtcminerstore');

      }


      cryptr = new Cryptr(userPassword);


      if(!this.vaultDataExists(localStorage) )
      {

        localStorage.setItem('vaultdata', JSON.stringify({data: cryptr.encrypt( this.getInitialVaultDataJson() ) } ) )

        vaultData = this.loadVaultData(  );

      }else{

        try{
          //populate the vaultdata variable from the file
             vaultData = this.loadVaultData(  );
         }catch(e)
         {
           console.log('Error: Password invalid for decrypting vault data.');
           process.exit();
           return;
         }


      }


    //  console.log('vaultData',vaultData)

    },


    vaultDataExists(localStorage)
    {

      try{
        var item = localStorage.getItem('vaultdata');
        return typeof item.data != undefined ;
      }catch(e)
      {
        return false;
      }

    },


    async askUserPassword(storageExists)
    {

      return new Promise(function (fulfilled,rejected) {


        var schema = {
            properties: {

              password: {
                hidden: true,
                message: 'Password must be at least 8 characters',
                required: true
              }
            }
          };

             prompt.start();
            // var result = await prompt.get(['password']);


            if(storageExists)
            {
              console.log("Please provide the password to unlock account data.")
            }else{
              console.log("Please provide a password to encrypt keystore data.")
            }

            prompt.get(schema, function (err, result) {

                if(err)
                {
                  rejected(err)
                }

                  fulfilled(result.password);
               });

       });
    },

    get0xBitcoinLocalFolderPath()
    {
      return this.getOSLocalDataFolderPath()  + '/.0xbitcoin';
    },

    getOSLocalDataFolderPath()
    {
        return (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : process.env.HOME))

    },


    handleCommand(subsystem_command,subsystem_option)
    {
      if(subsystem_command === 'new')
      {
        this.createAccount();
      }

      if(subsystem_command === 'list')
      {
        console.log('Ethereum accounts list:');
        console.log( vaultData.account_list );
        console.log('--------------------')
        console.log('Selected account:')
        console.log( vaultData.selected_account_address );
      }

      if(subsystem_command === 'select')
      {
        this.selectAccount(subsystem_option);
        this.saveVaultData( vaultData );
      }


    },


    //create a new account and append it to the account list in vault data , then save vault data
    createAccount()
    {
        account = this.web3.eth.accounts.create();

        vaultData.account_list.push(account)

        this.selectAccount( account.address )

        this.saveVaultData( vaultData )

    },

    selectAccount(public_address)
    {
      if(web3Utils.isAddress(public_address))
      {
        vaultData.selected_account_address = public_address;
        console.log('Selected account: ', public_address)
      }else{
        console.log(public_address, ' is not a valid ethereum address.  View your accounts with "npm run account list" ' )
      }
    },



    recoverAccountFromPrivateKey( privateKey )
    {

      return this.web3.eth.accounts.privateKeyToAccount(privateKey);
    },


    getAccount()
    {

      if( typeof vaultData.selected_account_address != undefined )
      {
            console.log('getting acct 2 ')

        var account_private_key = this.getPrivateKeyOfSelectedAccount()
        //ask for password  with AWAIT


        if(typeof account_private_key != undefined)
        {
            return this.recoverAccountFromPrivateKey( account_private_key )
        }else{
          console.log('Could not recover an account with your selected account address.  Please select another account with "npm run account select 0x####"' )
          process.exit();
        }


      }else{
        console.log('Please create an account with "npm run account new" or select an account with "npm run account select 0x####"')
        process.exit();
      }

     

    },

    getPrivateKeyOfSelectedAccount()
    {
      var selected_account_address = vaultData.selected_account_address;


      var account_list = vaultData.account_list;

    //  console.log( selected_account_address,account_list )

      for(i in account_list)
      {
        var acct = account_list[i];

        if(acct.address.toString() === selected_account_address.toString())
        {
          return acct.privateKey;
        }
      }

      return null;
    },

    encryptedStorageExists()
    {

      if (!fs.existsSync(this.get0xBitcoinLocalFolderPath()) || !fs.existsSync(this.get0xBitcoinLocalFolderPath() +'/0xbtcminerstore' )  ){
        return false;
      }

      if (!fs.existsSync(this.get0xBitcoinLocalFolderPath()+'/0xbtcminerstore/vaultdata' ) ){
        return false;
      }

      return true;

    },


    getInitialVaultDataJson()
    {
      var datastore = {
        "name": "0xbtc datastore",
        "account_list": [],
        "selected_account_address": null,
      }

      return JSON.stringify(  datastore );
    },



    loadVaultData()
    {
      //vaultData

      encryptedVaultData = JSON.parse(localStorage.getItem('vaultdata') ) .data;


      return vaultData = JSON.parse(cryptr.decrypt( encryptedVaultData  ));

    },

    saveVaultData()
    {

      localStorage.setItem('vaultdata', JSON.stringify({data: cryptr.encrypt( JSON.stringify(vaultData)) } ) )

      return true
    },




}
