
# 0xBitcoin Miner

## Running the packaged executables

#### Linux
1. Download /dist/linux/0xbtcminer-linux and unzip
2. Run this file with ./0xbtcminer-linux {command}
3. For example, ./0xbtcminer-linux account new

#### Windows/Mac
1. (Please build from source, see below)


## Building from Source

### Setup
1. Install NodeJS 8.9
2. Clone this repo
3. run 'npm install yarn -g' to install yarn
4. run 'yarn' to install dependencies for 0xbitcoin-miner




---------------

### Getting Started
1. Build a new mining account with 'npm run account new'
2. Write down these credentials
3. Mine 0xbitcoin tokens with the command 'npm run mine'

Note that it is necessary to fill the mining account with a small amount of ether.  Typically 0.005 eth is good enough to get started.  The ether is used for gas to make function calls to the token smart contract when your miner finds a solution to the Proof of Work.  When the gas is spent that means that you have found a solution! If you were the first to find it, you will be rewarded with 0xbitcoin tokens.  

## The Smart Contract
Read the smart contract here:

https://github.com/0xbitcoin/0xbitcoin-token
