//gpuminer.cc

//build with
//    node-gyp configure build --target=v8.9.4


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

void startMining(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void getSolutionsBuffer(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}




void setup_kernel ( curandState * state, unsigned long seed )
{
    int id = threadIdx.x;
    curand_init ( seed, id, 0, &state[id] );
}

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
