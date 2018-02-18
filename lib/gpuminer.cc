// hello.cc

//build with
//    node-gyp configure build --target=v8.9.4


#include <node.h>

namespace gpuminer {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void setChallengeNumber(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "set challenge number "));
}
void setDifficultyTarget(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void startMining(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void getSolutionsBuffer(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void init(Local<Object> exports) {
    NODE_SET_METHOD(exports, "hello", Method);
  NODE_SET_METHOD(exports, "setChallengeNumber", setChallengeNumber);
  NODE_SET_METHOD(exports, "setDifficultyTarget", setDifficultyTarget);
  NODE_SET_METHOD(exports, "startMining", startMining);
  NODE_SET_METHOD(exports, "getSolutionsBuffer", getSolutionsBuffer);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

}  // namespace demo
