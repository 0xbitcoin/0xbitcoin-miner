//gpuminer.cc

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

#include <curand.h>
#include <curand_kernel.h>
#include <cuda.h>

namespace gpuminer {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;


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

  
  
  //PLEASE FILL ME IN- MOST IMPORTANT FUNCTION 
void startMining(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  
    //start infinite loop
    // Needs to be VERY FAST and done in the GPU !!  (as much as possible) 
    while(true) {

      
      //generate random number -- nonce 
    //   int nonce = getRandomNumber();
      
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
  
  
  

  // Needs to be VERY FAST and done in the GPU !!  
  // Needs to perform a keccak the same way that solidity/web3 does it!! Please see 
  // https://web3js.readthedocs.io/en/1.0/web3-utils.html#utils-soliditysha3
/*
int keccak256(args[]) 
{
    return result
}
  
  */ 
  

//what am i doing ?

void setup_kernel ( curandState * state, unsigned long seed )
{
    int id = threadIdx.x;
    curand_init ( seed, id, 0, &state[id] );
}
  
 

//what am i doing ?

void addToCount(int N, int *y, curandState* globalState)
{
    int id = threadIdx.x + blockIdx.x * blockDim.x;
        while (id < N)
        {
            int number = generate(globalState, id) * 1000000;
            printf("%i\n", number);

            atomicAdd(&(y[0]), number);
            id += blockDim.x * gridDim.x;
        }
}


  

//what am i doing ?
void getRandomNumber()
{

 int N = 5;
 int *y, *d_y;
 y = (int*)malloc(N*sizeof(int));

 cudaMalloc(&d_y, N * sizeof(int));
 cudaMemcpy(d_y, y, N * sizeof(int), cudaMemcpyHostToDevice);

 curandState* devStates;
 cudaMalloc (&devStates, N * sizeof(curandState));
 srand(time(0));
 /** ADD THESE TWO LINES **/
 int seed = rand();
 setup_kernel<<<2, 5>>>(devStates,seed);
 /** END ADDITION **/
 addToCount<<<2, 5>>>(N, d_y, devStates);

 cudaMemcpy(y, d_y, N*sizeof(int), cudaMemcpyDeviceToHost);
 printf("%i\n", *y);

}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "getRandomNumber", getRandomNumber);

  NODE_SET_METHOD(exports, "setChallengeNumber", setChallengeNumber);
  NODE_SET_METHOD(exports, "setDifficultyTarget", setDifficultyTarget);
  NODE_SET_METHOD(exports, "startMining", startMining);
  NODE_SET_METHOD(exports, "getSolutionsBuffer", getSolutionsBuffer);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

}  // namespace demo
