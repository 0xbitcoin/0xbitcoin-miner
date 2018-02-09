
# 0xBitcoin ERC20 Token Miner

Solves proof of work to mine supported ERC20 tokens.  

#### Linux
1. Download [/dist/linux/0xbtcminer-linux](https://github.com/0xbitcoin/0xbitcoin-miner/raw/master/dist/0xbtcminer-linux.zip) and unzip
2. Unzip the project and double click on the file '0xbtcminer-linux' to run

If this does not work, run this file in a terminal with ./0xbtcminer-linux


#### Windows
1. Download [/dist/windows/0xbtcminer-win](https://github.com/0xbitcoin/0xbitcoin-miner/raw/master/dist/0xbtcminer-win.zip)

2. Unzip the project and double click on the file '0xbtcminer-win' to run

If this does not work, run this file in a terminal with 0xbtcminer-win.exe


#### Mac (build from source)
1. Install Homebrew & Node8
2. brew install yarn
3. clone/download this project
4. open a terminal, cd into the project folder and run 'yarn'
5. run with 'node index.js'

## Building from Source

### Setup (Windows/Mac/Linux)
1. Install NodeJS 8.9
2. Clone this repo
3. run 'npm install yarn -g' to install yarn
4. run 'yarn' to install dependencies for 0xbitcoin-miner


### Commands

      {commands}
      " help" - Show the help menu
      " account new" - Create a new mining account
      " account list" - List all mining accounts
      " account select 0x####" - Select a primary mining account by address
      " contract list" - List the selected token contract to mine
      " contract select 0x####" - Select a PoW token contract to mine
      " config gasprice #" - Set the gasprice used to submit PoW to the token smartcontract
      " config cpu_threads #" - Set the number of CPU cores to use for mining
      " config web3provider http://----:####" - Set the web3 provider url for submitting ethereum transactions
      " mine" - Begin mining




---------------

### Getting Started
1. Build a new mining account with 'account new'
2. View the private key with 'account list'
3. Write down these credentials
4. Mine 0xbitcoin tokens with the command 'mine'

Note that it is necessary to fill the mining account (it is an Ethereum account) with a small amount of ether.  Typically 0.005 eth is good enough to get started.  The ether is used for gas to make function calls to the token smart contract when your miner finds a solution to the Proof of Work.  When the gas is spent that means that you have found a solution! If you were the first to find it, you will be rewarded with 0xbitcoin tokens.  


### Testing

npm run test

## Tokens that can be mined using Proof of Work:

1. 0xBitcoin token - http://0xbitcoin.org - https://github.com/0xbitcoin/0xbitcoin-token
