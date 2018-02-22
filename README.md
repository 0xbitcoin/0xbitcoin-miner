
# 0xBitcoin ERC20 Token Miner

Solves proof of work to mine supported ERC20 tokens.  




## GPU MINER DEVELOPMENT
Join discussiom in the 'development' channel: https://discord.gg/pwC4yx

- Adding a 'c++ addon' at lib/gpuminer.cc  (PLEASE VIEW THIS FILE)
- Use the command 'npm run build' to rebuild it
- Use the command 'node indextest.js' to run basic tests for it

----------------------------

DEV PREREQS:
1. npm install -g node-gyp
2.  Cuda Toolkit
https://developer.nvidia.com/cuda-downloads?target_os=Linux&target_arch=x86_64&target_distro=Ubuntu&target_version=1604&target_type=runfilelocal
  MAKE SURE YOU CAN BUILD THIS :
 https://askubuntu.com/questions/940103/building-ccminer-on-ubuntu-17-04
1. i had to apt-get install libcurl4-openssl-dev
2. i had to go into the makefile and replace 'nvcc' with 'nvcc -ccbin clang-3.8'
---------------------------------


 ### BOUNTY AWARDS
1 Ether and 1000 0xBTC tokens are the bounty for important code commits related to this GPU accelerated mining software branch. Therefore if you contribute production code, you will receive compensation. These tokens are situated in the deployers account 0x5294b9f7a71a97b703fa04ba3a415c8a136bdeb1 and were received from kind donations by the community.


References:
https://github.com/KlausT/ccminer
https://github.com/nicehash/ccminer-sp
https://github.com/nicehash/ccminer-sp/blob/master/keccak/cuda_keccak256.cu

As of now:

  Can build the module

  Can read and write integers to the c++ module

Next to do:
  1. Integrate the cuda.h library
    a. add this https://github.com/kashif/node-cuda  (+binding.gyp)
  2. Finish the function to generate a random number
  3. Finish the function to perform a 'keccak'
  4. Write a loop that performs tons of keccaks on random numbers

    a. This loop will see if the results are smaller than the 'target'

    b. If so, the result will be pushed into an array of solutions resising in the c++ addon

  5. The javascript process will poll for the solutions to acquire them and then send them off to the network as normal





## Update 1.3.0 - Pool Mining

The first working pool for 0xBTC has launched and it is loaded as the default pool source for this new update! Simply open the miner, create a new ethereum account within, and run the command 'pool mine' to start mining!  No gas fees required.   





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
      "help" - Show the help menu

      "account new" - Create a new mining account
      "account list" - List all mining accounts
      "account select 0x####" - Select a primary mining account by address
      "account balance" - List the ether and token balance of your selected account

      "contract list" - List the selected token contract to mine
      "contract select 0x####" - Select a PoW token contract to mine

      "config gasprice #" - Set the gasprice used to submit PoW to the token smartcontract
      "config cpu_threads #" - Set the number of CPU cores to use for mining
      "config web3provider http://----:####" - Set the web3 provider url for submitting ethereum transactions

      "pool mine" - Begin mining into a pool
      "pool list" - List the selected mining pool
      "pool select http://####.com:####" - Select a pool to mine into

      "mine" - Begin mining solo, directly into the smartcontract




---------------

### Getting Started
1. Build a new mining account with 'account new'
2. View the private key with 'account list'
3. Write down these credentials
4. Mine 0xbitcoin tokens with the command 'mine'

Note that IF SOLO MINING it is necessary to fill the mining account (it is an Ethereum account) with a small amount of ether.  Typically 0.005 eth is good enough to get started.  The ether is used for gas to make function calls to the token smart contract when your miner finds a solution to the Proof of Work.  When the gas is spent that means that you have found a solution! If you were the first to find it, you will be rewarded with 0xbitcoin tokens.  (See the block explorer for typical gas prices at the current moment.)



## Pool Mining
- You can mine into a pool with the command 'pool mine'  
- When mining into a pool, your gasprice does not matter and you will pay NO GAS FEES :)
- Every pool is different so consult each pool owner.  Typically, pools will offer a token withdraw mechanism or automatically send tokens to your address on a periodic basis or when a limit is reached



### Vault Datafiles
(requires show hidden files and folders)

Stored at:

- Windows
    '/Users/{user}/Appdata/Roaming/.0xbitcoin'

- Mac
    '/home/{user}/Library/Preferences/.0xbitcoin'

- Linux
    '/home/{user}/.0xbitcoin'




### Testing

npm run test


## Credits
PLEASE CONSIDER DONATING TO:

1. Zegordo (Developed the accelerated CPU Miner)

        ETH address [0x8AE981d92875C88f713600EB7dC4D23FA7E0E621]



## Tokens that can be mined using Proof of Work:

1. 0xBitcoin token - http://0xbitcoin.org - https://github.com/0xbitcoin/0xbitcoin-token
