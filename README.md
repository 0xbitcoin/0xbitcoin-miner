
# 0xBitcoin ERC20 Token Miner

Solves proof of work to mine supported ERC20 tokens.  



### Update 1.6 - Config Files For Days

This new build uses miner-config.js for setting parameters and no longer has an active command line.  If you do not have an Ethereum account, it is recommended that you use Metamask to generate one.


### Official Releases Downloads

[Download Packaged Releases](https://github.com/0xbitcoin/0xbitcoin-miner/blob/master/RELEASES.md)



### Building from Source

#### Setup (Windows/Linux)
1. Install NodeJS 8.9
2. Run 'npm install yarn -g' to install yarn package manager
3. Clone/download the project
4. Open a terminal, cd into the project folder and run 'yarn' to install dependencies
5. Run the command 'npm run build' to build C files with node-gyp
6. Set up the config file 'miner-config.json' (duplicate miner-config-sample as a reference)
7. Start the miner with 'node index.js'

#### Setup (Mac)
1. Install Homebrew & NodeJS 8.9
2. Run 'brew install yarn' to install yarn package manager
3. Clone/download this project
4. Open a terminal, cd into the project folder and run 'yarn'
5. Run the command 'npm run build' to build C files with node-gyp
6. Set up the config file 'miner-config.json' (duplicate miner-config-sample as a reference)
7. Start the miner with 'node index.js'



## Miner-Config.js File

You must create a file called 'miner-config.json' in the same directory as index.js.  Duplicate 'miner-config-sample.json' and rename it.  

If you do not have a public address or private key, use Metamask or another Etherum wallet to make them.

REMINDER: You >can< set the web3provider to a ropsten, mainnet, or other type of test-network provider and the software will still work. If solo mining (not to a pool) just be sure to define the correct contract address for that network and be suure your account has a small amount of ether (or test-ether).

    "mining_account_public_address":"0x111111",
    "mining_account_private_key":"1234567",
    "mining_style":"solo" OR "pool",
    "contract_address":"0xb6...",
    "pool_url":"http://tokenminingpool.com:8080",
    "gas_price_gwei":10,
    "cpu_thread_count": 1,
    "web3provider": "https://infura.io/...."

---------------

### Getting Started
1. Duplicate the 'miner-config-sample.json' file and rename it to 'miner-config.json'
2. Set the parameters in this file appropriately
3. In the console, run the command 'node index.js' to start mining


### Pool Mining
- IF SOLO MINING it is necessary to fill the mining account (it is an Ethereum account) with a small amount of ether.  
- Typically 0.005 eth is good enough to get started.  The ether is used for gas to make function calls to the token smart contract when your miner finds a solution to the Proof of Work.  
- When the gas is spent that means that you have found a solution! If you were the first to find it, you will be rewarded with 0xbitcoin tokens.  (See the block explorer for typical gas prices at the current moment.)



### Pool Mining
- When mining into a pool, your gasprice does not matter and you will pay NO GAS FEES  
- Every pool is different so consult each pool owner.  Typically, pools will offer a token withdraw mechanism or automatically send tokens to your address on a periodic basis or when a limit is reached





### Testing

npm run test


## Credits

1. Zegordo (Developed the accelerated CPU Miner)

        ETH address [0x8AE981d92875C88f713600EB7dC4D23FA7E0E621]



## Tokens that can be mined using Proof of Work:

1. 0xBitcoin token - http://0xbitcoin.org - https://github.com/0xbitcoin/0xbitcoin-token
