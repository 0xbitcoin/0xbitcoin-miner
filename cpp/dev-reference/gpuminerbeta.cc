//gpuminer.cc

//PLEASE REFERENCE THE NODEJS c++ ADDON DOCS !!!!!!!!
//https://nodejs.org/api/addons.html



//build with
//    node-gyp configure build --target=v8.9.4

/*
There is a total bounty of 1 Ether and 1000 0xBTC tokens that will be split up and given to contributors to this as reward


This c++ addon will be provided uint256 numbers: X, Y and T
Where X is an ethereum address
Y is the 'challenge number'
T is the target

This c++ addon will continuously run a loop in which:
  1. A random number is generated - called a Nonce
  2. A result is found of S = Keccak256(nonce,X,Y)
  3. If S < T then we will push S to an array


From javascript, we will provide X, Y , and T to this addon and we will read back solutions (S) from the array



//maybe we will use uint256 https://github.com/calccrypto/uint256_t ?


*/

#include <node.h>
#include <nan.h>


#include <stdio.h>
#include <stdlib.h>

#include <ctime>

#include <string>
#include <thread>


// #include <keccak256>

namespace gpuminer {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Number;


//these are global variable accessible to both threads
uint32_t difficultyTarget;
uint32_t challengeNumber; //should this be a string ?
uint32_t minerEthAddress;
//string minerEthAddress = ""; //should this be astring ?

uint32_t *solutions = new int[1000];
uint32_t buffered_solutions_count = 0;

void setChallengeNumber(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  challengeNumber = args[0]->IntegerValue();

  args.GetReturnValue().Set(challengeNumber);
}
void setDifficultyTarget(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  difficultyTarget = args[0]->IntegerValue();

  args.GetReturnValue().Set(difficultyTarget);
}



//what am i doing ?
uint32_t getRandomNumber()
{
    srand(time(NULL));

    return rand();

}

//not necessary - just for test
void getRandomNumberForNode(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  uint32_t r  = getRandomNumber();

  args.GetReturnValue().Set(Number::New(isolate,r) );
}





void pushSolutionToBuffer(uint32_t nonce)
{
  if(buffered_solutions_count < 1000)
  {
      solutions[buffered_solutions_count] = nonce;
      buffered_solutions_count++;
  }else {
    //too many queued solutions
  }

}

  //not implemented - a Get function so we can read solutions back into javascript
void getSolutionsBuffer(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  uint32_t nonce = 0;

  if( buffered_solutions_count > 0)
  {
    nonce = solutions[0]; //get first soln
  }

  args.GetReturnValue().Set(Number::New(isolate,nonce));
}

void clearSolutionsBuffer(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

   //clear array
   std::fill_n(solutions, 1000, 0);
   buffered_solutions_count = 0;

  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "buffer cleared"));
}



  // Needs to be VERY FAST and done in the GPU !!
  // Needs to perform a keccak the same way that solidity/web3 does it!! Please see
  // https://web3js.readthedocs.io/en/1.0/web3-utils.html#utils-soliditysha3

uint32_t keccak256(uint32_t args[])
{
    uint32_t nonce = args[0];
    uint32_t ethAddress = args[1];
    uint32_t challengeNumber = args[2];

    //fix me !  I dont actually work :[

    return nonce;
}



  //start infinite loop
  // Needs to be VERY FAST and done in the GPU !!  (as much as possible)

  //can this entire loop be done in the GPU ?

void mine(){
  //PLEASE FILL ME IN- MOST IMPORTANT FUNCTION
  while(true) {

    //generate random number -- nonce
    uint32_t nonce = getRandomNumber();

    uint32_t keccak_args[3] = {nonce, minerEthAddress, challengeNumber};

    uint32_t hash[16];

  //  int hash = keccak256(keccak_args);

    if ( result < difficultyTarget)
    {
        //  Push the working nonce to an array !!
          pushSolutionToBuffer(nonce);
    }
  }
}


void startMining(const FunctionCallbackInfo<Value>& args) {
Isolate* isolate = args.GetIsolate();

  //mine in another thread
  std::thread t1(mine );
  t1.detach(); //let it operate independently


    args.GetReturnValue().Set(String::NewFromUtf8(isolate, "started mining thread"));
}



void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "getRandomNumber", getRandomNumberForNode);
  NODE_SET_METHOD(exports, "setChallengeNumber", setChallengeNumber);
  NODE_SET_METHOD(exports, "setDifficultyTarget", setDifficultyTarget);
  NODE_SET_METHOD(exports, "startMining", startMining);
  NODE_SET_METHOD(exports, "getSolutionsBuffer", getSolutionsBuffer);
  NODE_SET_METHOD(exports, "clearSolutionsBuffer", clearSolutionsBuffer);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

}  // namespace demo
