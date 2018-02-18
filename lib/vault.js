var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';
/*
  Every time the software is booted, the vault password
  must be provided to unlock the encrypted private key store


*/


var tokenContractJSON = require('../contracts/_0xBitcoinToken.json');



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

  var isUnlocked = false ;


/*
  Array.prototype.findByAttribute = function(key,value) {
    for(i in this)
    {
      var item = this[i];

      if(item[key] === value )
      {
        console.log('returning ',item)
        return item;
      }
    }
    return null;
  };*/

module.exports =  {


    async init(web3,miningLogger)
    {


      this.miningLogger = miningLogger;

     if(isUnlocked){
       return true;
     }



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

           return false;
         }


      }
        isUnlocked = true;
      this.web3 = web3;
      this.web3.setProvider(this.getWeb3Provider());


      this.miningLogger.init(this);

      this.tokenContract =  new web3.eth.Contract(tokenContractJSON.abi,this.getTokenContractAddress())



     return true;

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
                hidden: false,
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
        return (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME))

    },


   async handleAccountCommand(subsystem_command,subsystem_option)
    {
      if(subsystem_command === 'new')
      {
        this.createAccount();
      }

      if(subsystem_command === 'list')
      {
        console.log('Ethereum accounts list:');
        this.printAccountsList()
        console.log('--------------------')
        console.log('Selected account:')
        console.log( vaultData.selected_account_address );
        console.log('\n')
      }

      if(subsystem_command === 'select'  )
      {
        this.selectAccount(subsystem_option);
        this.saveVaultData(  );
        console.log('Selected account:')
        console.log( vaultData.selected_account_address );
        console.log('\n')
      }

      if(subsystem_command === 'balance'  )
      {
        var ethBalance = await this.getEtherBalance(this.getAccount().address)

        var tokenBalance = await this.getTokenBalance(this.getAccount().address)
        var tokenName = await this.tokenContract.methods.name().call()

        console.log('Account:', this.getAccount().address)
        console.log('Eth Balance:', ethBalance)
        console.log(tokenName,' Balance:', tokenBalance)

        console.log('\n')
      }





    },


    async getEtherBalance(address)
    {
      var balanceWei = await this.web3.eth.getBalance(address);
      return web3Utils.fromWei(balanceWei)
    },

    async getTokenBalance(address)
    {
      var decimals = await this.tokenContract.methods.decimals().call()

      var balanceTokensRaw =  await this.tokenContract.methods.balanceOf(this.getAccount().address).call()

      return (balanceTokensRaw*1.0 / (Math.pow(10,decimals)))
    },



    async handleContractCommand(subsystem_command,subsystem_option)
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
        var tokenName = await this.tokenContract.methods.name().call()
        console.log(tokenName, ' ', vaultData.selected_contract_address );
      }

    },

    async handleConfigCommand(subsystem_command,subsystem_option)
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


      if(subsystem_command === 'list' )
      {

        console.log('Web3 Provider:', this.getWeb3Provider())

        console.log('CPU Threads:', this.getNumThreads())

        console.log('Gas Price (gwei):', this.getGasPriceGwei())


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
        if(this.hasAddress(public_address)){
          vaultData.selected_account_address = public_address;
          console.log('\n')
          console.log('Selected account: ', public_address)
        }else{
          console.log('\n')
          console.log(public_address, ' is not an ethereum address saved in your miner.  View your accounts with "account list" and select one of those.  The ability to import an account does not exist and this is a "good practice" security measure.  ' )
        }
      }else{
        console.log('\n')
        console.log(public_address, ' is not a valid ethereum address.  View your accounts with "account list" ' )
      }
    },

    hasAddress(public_address)
    {
      list = vaultData.account_list;

      for(i in list)
      {
        acct = list[i];

        if(acct.address === public_address){
          return true;
        }
      }

     return false;
    },


    setCPUThreads(threadcount)
    {
      var int_threads = parseInt(threadcount);

      if(int_threads >= 1 && int_threads < 6400)
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
          console.log('Your selected contract address is invalid.  Please select a valid PoW token contract to mine into with "contract select 0x####"')
          return false;
        }

      }else{
        console.log('Please select a PoW token contract to mine into with "contract select 0x####"')
        return false;
      }
    },



    getAccount()
    {

      if(   vaultData.selected_account_address != null ) //check for null or undefined
      {

        var account_private_key = this.getPrivateKeyOfSelectedAccount()
        //ask for password  with AWAIT

        if(typeof account_private_key != undefined)
        {
            return this.recoverAccountFromPrivateKey( account_private_key )
        }else{
          console.log('Could not recover an account with your selected account address.  Please select another account with "account select 0x####"' )

          return false;
        }


      }else{
        console.log('Please create an account with "account new" or select an account with "account select 0x####"')

        return false;
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


    printAccountsList()
    {
      list = vaultData.account_list;

      console.log('\n')

      for(i in list)
      {
        acct = list[i];

        console.log('Account ', i)
        console.log('Address: ', acct.address)
        console.log('PrivateKey: ', acct.privateKey)
        console.log('\n')
      }
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
        "mining_gas_price": 1,
        "cpu_threads": 8,
        "web3_provider_url": INFURA_MAINNET_URL,
        "selected_account_address": null,
        "selected_contract_address": this.getDefaultContractAddress()
      }

      return JSON.stringify(  datastore );
    },

    getDefaultContractAddress()
    {

      return ContractInterface.networks.mainnet.contracts._0xbitcointoken.blockchain_address
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
