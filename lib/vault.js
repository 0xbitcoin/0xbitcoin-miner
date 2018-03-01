var INFURA_ROPSTEN_URL = 'https://ropsten.infura.io/gmXEVo5luMPUGPqg6mhy';
var INFURA_MAINNET_URL = 'https://mainnet.infura.io/gmXEVo5luMPUGPqg6mhy';
var MINING_POOL_URL = 'http://tokenminingpool.com:8586';

const VAULT_DATA_VERSION = 2;
/*
  Every time the software is booted, the vault password
  must be provided to unlock the encrypted private key store


*/

//var qrcode = require('qrcode-terminal');

var tokenContractJSON = require('../contracts/_0xBitcoinToken.json');



var ContractInterface = require("../contracts/DeployedContractInfo")

//erorring

  var LocalStorage = require('node-localstorage').LocalStorage;



  var web3Utils = require('web3-utils')

  const fs   = require('fs');
  const path = require('path');

  var Cryptr = require('cryptr');
  var cryptr;

var mkdirp = require('mkdirp');
var prompt = require('prompt');

  var vaultData = {};

  var userPassword = null;

  var requirePassword = false ;
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

  async requirePassword(require)
  {
     requirePassword = require;
  },


    async init(web3,miningLogger)
    {


      this.miningLogger = miningLogger;

     if(isUnlocked){
       return true;
     }



     if( requirePassword && userPassword == null ){
       userPassword = await this.askUserPassword(false);


       while( userPassword.length < 8 )
       {
         console.log('Please use a password that is at least 8 characters in length.')
         userPassword = await this.askUserPassword(true);
       }
        cryptr = new Cryptr(userPassword);
     }




       if( !this.encryptedStorageExists() )
      {
        //build the storage folders if they (probably) dont exist anymore
          mkdirp(this.get0xBitcoinLocalFolderPath(), function (err) {
            if (err) console.error(err)
            else console.log('created new keystore file at ' + this.get0xBitcoinLocalFolderPath())
        }.bind(this));

      }

      localStorage = new LocalStorage(this.get0xBitcoinLocalFolderPath()+'/0xbtcminerstore');


      if(!this.vaultDataExists(localStorage) )
      {

        localStorage.setItem('vaultdata', JSON.stringify({vault: {data:  this.getInitialVaultDataJson() , version: VAULT_DATA_VERSION} } ) )

        vaultData = await this.loadVaultData(  );


      }else{

        try{
          //populate the vaultdata variable from the file
             vaultData = await this.loadVaultData(  );


            // console.log('gas price ', vaultData.mining_gas_price)

         }catch(e)
         {
           console.log(e);

           console.log('Error: Password invalid for decrypting vault data.');


           cryptr = null //dont hold onto an invalid cryptr instances
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
        await this.createAccount();

        console.log('\n')

      //  qrcode.generate(vaultData.selected_account_address, {small: true});
      }

      if(subsystem_command === 'list')
      {
        console.log('Ethereum accounts list:');
        this.printAccountsList()
        console.log('--------------------')
        console.log('Selected account:')
        console.log( vaultData.selected_account_address );
        console.log('\n')

      //  qrcode.generate(vaultData.selected_account_address, {small: true});

        console.log('\n')
      }

      if(subsystem_command === 'select'  )
      {
        this.selectAccount(subsystem_option);
        await this.saveVaultData(  );
        console.log('Selected account:')
        console.log( vaultData.selected_account_address );
        console.log('\n')

        //    qrcode.generate(vaultData.selected_account_address, {small: true});
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
        await this.saveVaultData(  );
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
        await this.saveVaultData(  );
      }

      if(subsystem_command === 'web3provider' )
      {
        this.setWeb3ProviderUrl(subsystem_option);
        await this.saveVaultData(  );

      }

      if(subsystem_command === 'cpu_threads' )
      {
        this.setCPUThreads(subsystem_option);
        await this.saveVaultData(  );

      }


      if(subsystem_command === 'list' )
      {

        console.log('Web3 Provider:', this.getWeb3Provider())

        console.log('CPU Threads:', this.getNumThreads())

        console.log('Gas Price (gwei):', this.getGasPriceGwei())


      }





    },



    //create a new account and append it to the account list in vault data , then save vault data
    async createAccount()
    {
        account = this.web3.eth.accounts.create();

        account.cryptedPrivateKey = cryptr.encrypt( account.privateKey )

        vaultData.account_list.push(account)

        this.selectAccount( account.address )

        await this.saveVaultData( vaultData )

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
          //console.log('\n')
          //console.log(public_address, ' is not an ethereum address saved in your miner.  View your accounts with "account list" and select one of those.  The ability to import an account does not exist and this is a "good practice" security measure.  ' )

          account = {
                      address: public_address,
                      privateKey: null ,
                      accountType: 'readOnly'
                    }

          vaultData.account_list.push(account)
          vaultData.selected_account_address = public_address;

          console.log('\n')
          console.log('Selected account (READ ONLY): ', public_address)

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


    selectMiningPool(pool_url)
    {

        vaultData.mining_pool_url = pool_url;
       console.log('Selected mining pool: ', pool_url)

    },

    getMiningPool()
    {

        return vaultData.mining_pool_url;

    },

    recoverFullAccountFromPrivateKey( privateKey )
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



    getFullAccount()
    {

      if(   vaultData.selected_account_address != null ) //check for null or undefined
      {

        var account_private_key = this.getPrivateKeyOfSelectedAccount()
        //ask for password  with AWAIT

        if(typeof account_private_key != undefined &&  account_private_key!= null)
        {
            return this.recoverFullAccountFromPrivateKey( account_private_key )
        }else{

          console.log('Could not recover a full account with your selected account address.  Please select another account with "account select 0x####"' )

          return false;
        }


      }else{
        console.log('Please create a full account with a private key using "account new" or select a full account with "account select 0x####"')

        return false;
      }


    },

    getAccount() // only public address
    {

      if( vaultData.selected_account_address != null ) //check for null or undefined
      {

        return {    address: vaultData.selected_account_address  } ;
      }
      return false;
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
        "mining_pool_url": MINING_POOL_URL,
        "selected_account_address": null,
        "selected_contract_address": this.getDefaultContractAddress()
      }

      return    datastore  ;
    },

    getDefaultContractAddress()
    {

      return ContractInterface.networks.mainnet.contracts._0xbitcointoken.blockchain_address
    },

    hasValidPassword()
    {
      return (cryptr != null);
    },


    async loadVaultData()
    {
      //vaultData
      var parsedVault = (JSON.parse(localStorage.getItem('vaultdata') ) ) ;



      var vaultVersion = 1;

      if(parsedVault.vault && parsedVault.vault.version)
      {
        vaultVersion = parsedVault.vault.version
      }


      if(vaultVersion == 1)
      {

        var unparsedVaultData = localStorage.getItem('vaultdata');


          //if we dont have PW, ask for it here.. transition to new system
         await this.assertValidPassword()

         console.log(unparsedVaultData)
         console.log(cryptr , userPassword )

          vaultData = JSON.parse(cryptr.decrypt( JSON.parse(unparsedVaultData).data  ));


         await this.saveVaultData( vaultData ); //save as new version

        return vaultData
      }else if(vaultVersion == 2)
      {

      //  var unparsedVaultData = localStorage.getItem('vaultdata');

         vaultData =    parsedVault.vault.data   ;

         if(requirePassword){ //we only do this in certain modes

          await this.assertValidPassword()

           for(var i in vaultData.account_list)
           {
             if(vaultData.account_list[i].cryptedPrivateKey != null)
             {
                vaultData.account_list[i].privateKey = cryptr.decrypt( vaultData.account_list[i].cryptedPrivateKey )
             }
           }
         }

         return vaultData;
      }



    },



    async saveVaultData( vData )
    {

      if(vData == null)
      {
        vData = vaultData
      }

      //when saving each account, make sure only the encrypted private key is being saved
      for(var i in vData.account_list)
      {
        if(vData.account_list[i].privateKey != null && vData.account_list[i].cryptedPrivateKey == null)
        {

          await this.assertValidPassword()

          vData.account_list[i].cryptedPrivateKey = cryptr.encrypt( vData.account_list[i].privateKey )
          vData.account_list[i].privateKey = null;
        }

      }




      localStorage.setItem('vaultdata', JSON.stringify({vault: {data: vData, version: VAULT_DATA_VERSION  }  } ) )


        //reload  private keys back into memory
      for(var i in vData.account_list)
      {
        if(vData.account_list[i].cryptedPrivateKey != null)
        {
          await this.assertValidPassword();
           vData.account_list[i].privateKey = cryptr.decrypt( vData.account_list[i].cryptedPrivateKey );
        }

      }

      return true
    },

    async assertValidPassword()
    {

      if( userPassword == null || !this.hasValidPassword()  ){

        console.log('\n')
        userPassword = await this.askUserPassword(false);


        while( userPassword.length < 8 )
        {
          console.log('\n')
          console.log('Please use a password that is at least 8 characters in length.')
          console.log('\n')
          userPassword = await this.askUserPassword(true);
        }

        cryptr = new Cryptr(userPassword);
      }

    }


}
