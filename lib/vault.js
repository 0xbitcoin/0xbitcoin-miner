var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';
/*
  Every time the software is booted, the vault password
  must be provided to unlock the encrypted private key store


*/

var ContractInterface = require("../contracts/DeployedContractInfo")


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
            else console.log('created new encrypted keystore file at ' + this.get0xBitcoinLocalFolderPath())
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

      this.web3 = web3;
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


    handleAccountCommand(subsystem_command,subsystem_option)
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

      if(subsystem_command === 'select'  )
      {
        this.selectAccount(subsystem_option);
        this.saveVaultData(  );
        console.log('Selected account:')
        console.log( vaultData.selected_account_address );

      }




    },

    handleContractCommand(subsystem_command,subsystem_option)
    {

      if(subsystem_command === 'select')
      {
        this.selectContract(subsystem_option);
        this.saveVaultData(  );
        console.log('Selected mining contract:')
        console.log( vaultData.selected_contract_address );
      }

      if(subsystem_command === 'show' || subsystem_command === 'list')
      {
        console.log('Selected mining contract:')
        console.log( vaultData.selected_contract_address );
      }

    },

    handleConfigCommand(subsystem_command,subsystem_option)
    {

      if(subsystem_command === 'gasprice')
      {
        this.setGasPrice(subsystem_option);
        this.saveVaultData(  );
      }

      if(subsystem_command === 'web3provider' )
      {
        this.setWeb3ProviderUrl(subsystem_option);
        this.saveVaultData(  );

      }

      if(subsystem_command === 'cpu_threads' )
      {
        this.setCPUThreads(subsystem_option);
        this.saveVaultData(  );

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


    setCPUThreads(threadcount)
    {
      var int_threads = parseInt(threadcount);

      if(int_threads >= 1 && int_threads < 64)
      {
          vaultData.cpu_threads = int_threads;
          console.log('Set thread count: ', int_threads);
      }else{
        console.log('You really have this many CPU cores???: ', int_threads, "... try again.");
      }


    },

    setGasPrice(gprice) // in gwei
    {

      var f_gprice = parseFloat(gprice);

      if(f_gprice > 0.0001 && f_gprice < 100000)
      {
          vaultData.mining_gas_price = f_gprice;
          console.log('Set gas price (gwei): ', f_gprice);
      }

      if(f_gprice > 100)
      {
        console.log('WARNING: Extremely high gas price (gwei) detected - use something smaller?: ', f_gprice);
      }

    },

    setWeb3ProviderUrl(url)
    {
      vaultData.web3_provider_url = url;
      console.log('Set web3 provider url: ', url);
    },


    getWeb3Provider()
    {
      return vaultData.web3_provider_url;
    },


    getGasPriceWei()
    {
      const weiToGwei = 1e9;

      return vaultData.mining_gas_price * weiToGwei;
    },

    getGasPriceGwei()
    {
      return vaultData.mining_gas_price;
    },

    getNumThreads()
    {
      return vaultData.cpu_threads;
    },



    selectContract(contract_address)
    {
      if(web3Utils.isAddress(contract_address))
      {
        vaultData.selected_contract_address = contract_address;
        console.log('Selected contract to mine: ', contract_address)
      }else{
        console.log(contract_address, ' is not a valid ethereum address. Please try a different contract address.' )
      }
    },

    recoverAccountFromPrivateKey( privateKey )
    {

      return this.web3.eth.accounts.privateKeyToAccount(privateKey);
    },

    getTokenContractAddress()
    {

      if( typeof vaultData.selected_contract_address != undefined )
      {

        if( web3Utils.isAddress(vaultData.selected_contract_address) )
        {
          return vaultData.selected_contract_address;
        }else{
          console.log('Your selected contract address is invalid.  Please select a valid PoW token contract to mine into with "npm run contract 0x####"')
          process.exit();
        }

      }else{
        console.log('Please select a PoW token contract to mine into with "npm run contract 0x####"')
        process.exit();
      }
    },



    getAccount()
    {
      console.log('Selected mining account:', vaultData.selected_account_address )

      if(   vaultData.selected_account_address != null ) //check for null or undefined
      {

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
        "mining_gas_price": 2,
        "cpu_threads": 8,
        "web3_provider_url": INFURA_MAINNET_URL,
        "selected_account_address": null,
        "selected_contract_address": ContractInterface.contracts._0xbitcointoken.blockchain_address
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
