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
#include <nan.h>


#include <stdio.h>
#include <stdlib.h>



namespace gpuminer {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;
using v8::Number;

int difficultyTarget;
int challengeNumber;
//string minerEthAddress ;

//int[]  solutions;

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
int getRandomNumber()
{
    return rand();

}

//not necessary - just for test
void getRandomNumberForNode(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  int r  = getRandomNumber();

  args.GetReturnValue().Set(Number::New(isolate,r) );
}


  //PLEASE FILL ME IN- MOST IMPORTANT FUNCTION
void startMining(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

    //start infinite loop
    // Needs to be VERY FAST and done in the GPU !!  (as much as possible)
    while(true) {


      //generate random number -- nonce
      int nonce = getRandomNumber();

      //int result = keccak256(nonce, minerEthAddress, challengeNumber )


      /*if ( result < difficultyTarget)
      {

            Push the working nonce to an array !!
            solutions.push( nonce  )
      }

      */


    }

}

  //not implemented - a Get function so we can read solutions back into javascript
void getSolutionsBuffer(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();


  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void clearSolutionsBuffer(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();


  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "buffer cleared"));
}



  // Needs to be VERY FAST and done in the GPU !!
  // Needs to perform a keccak the same way that solidity/web3 does it!! Please see
  // https://web3js.readthedocs.io/en/1.0/web3-utils.html#utils-soliditysha3
/*
int keccak256(args[])
{
    return result
}

  */





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
