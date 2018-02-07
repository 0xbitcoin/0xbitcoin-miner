
# 0xBitcoin ERC20 Token Miner

## Running the packaged executables

#### Linux
1. Download [/dist/linux/0xbtcminer-linux](https://github.com/0xbitcoin/0xbitcoin-miner/raw/master/dist/0xbtcminer-linux.zip) and unzip
2. Run this file in a terminal with ./0xbtcminer-linux {command}
3. For example, ./0xbtcminer-linux account new

#### Windows
1. Download [/dist/windows/0xbtcminer-win.exe](https://github.com/0xbitcoin/0xbitcoin-miner/raw/master/dist/0xbtcminer-win.zip) and unzip
2. Run this file in a terminal with 0xbtcminer-win.exe {command}
3. For example, 0xbtcminer-win.exe account new


#### Mac (build from source)
1. Install Homebrew & Node8
2. brew install yarn 
3. clone/download this project
4. open a terminal, cd into the project folder and run 'yarn' 
5. run commands like 'npm run account new'

## Building from Source

### Setup
1. Install NodeJS 8.9
2. Clone this repo
3. run 'npm install yarn -g' to install yarn
4. run 'yarn' to install dependencies for 0xbitcoin-miner


### Commands
If you compiled from source, run commands with "npm run {command}"

If using a compiled binary such as 0xbtcminer-linux, run commands with "./0xbtcminer-linux {command}"

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
1. Build a new mining account with 'npm run account new'
2. Write down these credentials
3. Mine 0xbitcoin tokens with the command 'npm run mine'

Note that it is necessary to fill the mining account with a small amount of ether.  Typically 0.005 eth is good enough to get started.  The ether is used for gas to make function calls to the token smart contract when your miner finds a solution to the Proof of Work.  When the gas is spent that means that you have found a solution! If you were the first to find it, you will be rewarded with 0xbitcoin tokens.  

## The Smart Contract
Read the smart contract here:

https://github.com/0xbitcoin/0xbitcoin-token
