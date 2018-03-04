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


*/

#include <node.h>



#include <stdio.h>
#include <stdlib.h>
#include <cuda.h>

#include <ctime>

#include <string>
#include <thread>

// if i add this then i get a conflicting declaration!?
//int MAX_GPUS = 64;
//short* device_map=new short[MAX_GPUS]


//THIS causes the issue of 'device map'  being undefined in js.. ??
#include "./sha256_0xb.cu"


namespace gpuminer {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Number;


//these are global variable accessible to both threads
int difficultyTarget;
int challengeNumber; //should this be a string ?
int minerEthAddress;
//string minerEthAddress = ""; //should this be astring ?

int *solutions = new int[1000];
int buffered_solutions_count = 0;

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
void setEthAddress(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  minerEthAddress = args[0]->IntegerValue();

  args.GetReturnValue().Set(minerEthAddress);
}


void testHashFunction(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  int arg0 = args[0]->IntegerValue();


  int *inputs = new int[3];
  int *outputs = new int[10];

  inputs[0] = arg0;

  //cuda
  sha256s_hash(outputs,inputs);

  args.GetReturnValue().Set(outputs[0]);
}




//what am i doing ?
int getRandomNumber()
{
    srand(time(NULL));

    return rand();

}

//not necessary - just for test
void getRandomNumberForNode(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  int r  = getRandomNumber();

  args.GetReturnValue().Set(Number::New(isolate,r) );
}





void pushSolutionToBuffer(int nonce)
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

  int nonce = 0;

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

int keccak256(int args[])
{
    int nonce = args[0];
    int ethAddress = args[1];
    int challengeNumber = args[2];




    //  sha256s_hash(void *output, const void *input)
  //   sha256s_hash(hashing_output,hashing_input)


    //fix me !  I dont actually work :[

    return nonce;
}

//for testing -- fix me !!!
void printKeccak256(const FunctionCallbackInfo<Value>& args)
{
  Isolate* isolate = args.GetIsolate();


  int difficultyTarget = args[0]->IntegerValue();
  int challengeNumber = args[1]->IntegerValue();
  int ethAddress = args[2]->IntegerValue();


      //fix me !!
      args.GetReturnValue().Set(String::NewFromUtf8(isolate, "keccak result --implement me  "));


}


  //start infinite loop
  // Needs to be VERY FAST and done in the GPU !!  (as much as possible)

  //can this entire loop be done in the GPU ?

void mine(){
  //PLEASE FILL ME IN- MOST IMPORTANT FUNCTION

  struct work* work;
  unsigned long *hashes_done;
  uint32_t max_nonce = 9999999;
  scanhash_sha256s(1,work, max_nonce,hashes_done);

/*  while(true) {

    //generate random number -- nonce -- can we do this in the GPU -- should we ?
    int nonce = getRandomNumber();

    int keccak_args[3] = {nonce, minerEthAddress, challengeNumber};

    int result = keccak256(keccak_args);

    if ( result < difficultyTarget)
    {
        //  Push the working nonce to an array !!
          pushSolutionToBuffer(nonce);
    }
  }*/
}


void startMining(const FunctionCallbackInfo<Value>& args) {
Isolate* isolate = args.GetIsolate();

  //mine in another thread
  std::thread t1(mine );
  t1.detach(); //let it operate independently


    args.GetReturnValue().Set(String::NewFromUtf8(isolate, "started mining thread"));
}



void init(Local<Object> exports) {



    NODE_SET_METHOD(exports, "setChallengeNumber", setChallengeNumber);
      NODE_SET_METHOD(exports, "setEthAddress", setEthAddress);
  NODE_SET_METHOD(exports, "setDifficultyTarget", setDifficultyTarget);
  NODE_SET_METHOD(exports, "startMining", startMining);
  NODE_SET_METHOD(exports, "getSolutionsBuffer", getSolutionsBuffer);
  NODE_SET_METHOD(exports, "clearSolutionsBuffer", clearSolutionsBuffer);

  NODE_SET_METHOD(exports, "testHashFunction", testHashFunction);

  NODE_SET_METHOD(exports, "getRandomNumber", getRandomNumberForNode);
  NODE_SET_METHOD(exports, "getKeccak256", printKeccak256);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

}  // namespace demo
