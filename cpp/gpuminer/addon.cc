/*********************************************************************
 * NAN - Native Abstractions for Node.js
 *
 * Copyright (c) 2017 NAN contributors
 *
 * MIT License <https://github.com/nodejs/nan/blob/master/LICENSE.md>
 ********************************************************************/

#include <nan.h>

#include "gpuminer.h"
 

namespace miner {

  using namespace Nan;


  ::GpuMiner* gpuminer = nullptr;


  //call C++ dtors:
  void cleanup(void* p) {
    delete reinterpret_cast<GpuMiner*>(p);
  }


  class Miner : public AsyncWorker {
    public:
      Miner(Callback *callback)
        : AsyncWorker(callback)
      { }

      ~Miner() {}

      // This function runs in a thread spawned by NAN
      void Execute () {
        if (gpuminer) {
          gpuminer->run(); // blocking call
        } else {
          SetErrorMessage("{error: 'no gpuminer!'}");
        }
      }

    private:
      // Executed when the async work is complete
      // this function will be run inside the main event loop
      // so it is safe to use V8 again
      void HandleOKCallback () {
        HandleScope scope;

        v8::Local<v8::Value> argv[] = {
          Null(),
          New<v8::String>(gpuminer->solution()).ToLocalChecked()
        };

        callback->Call(2, argv);
      }
  };

  // Run an asynchronous function
  //  First and only parameter is a callback function
  //  receiving the solution when found
  NAN_METHOD(run) {
    Callback *callback = new Callback(To<v8::Function>(info[0]).ToLocalChecked());
    AsyncQueueWorker(new Miner(callback));
  }

  NAN_METHOD(stop) {
    gpuminer->stop();
    info.GetReturnValue().SetUndefined();
  }

  NAN_METHOD(setChallengeNumber) {
    MaybeLocal<v8::String> inp = Nan::To<v8::String>(info[0]);
    if (!inp.IsEmpty()) {
      gpuminer->setChallengeNumber(std::string(*Nan::Utf8String(inp.ToLocalChecked())));
    }
    info.GetReturnValue().SetUndefined();
  }
  NAN_METHOD(setDifficultyTarget) {
    MaybeLocal<v8::String> inp = Nan::To<v8::String>(info[0]);
    if (!inp.IsEmpty()) {
      gpuminer->setDifficultyTarget(std::string(*Nan::Utf8String(inp.ToLocalChecked())));
    }
    info.GetReturnValue().SetUndefined();
  }
  NAN_METHOD(setMinerAddress) {
    MaybeLocal<v8::String> inp = Nan::To<v8::String>(info[0]);
    if (!inp.IsEmpty()) {
      gpuminer->setMinerAddress(std::string(*Nan::Utf8String(inp.ToLocalChecked())));
    }
    info.GetReturnValue().SetUndefined();
  }

  // Get the number of hashes performed until now
  //  and reset it to 0
  //ADD THIS BACK IN LATER 
 /* NAN_METHOD(hashes) {
    uint32_t const value = OpenCLSolver::hashes;
    OpenCLSolver::hashes = 0;
    info.GetReturnValue().Set(value);
  }*/ 

  // Defines the functions our add-on will export
  NAN_MODULE_INIT(Init) {
    Set(target
      , New<v8::String>("run").ToLocalChecked()
      , New<v8::FunctionTemplate>(run)->GetFunction());

    Set(target
      , New<v8::String>("stop").ToLocalChecked()
      , New<v8::FunctionTemplate>(stop)->GetFunction());

    Set(target
      , New<v8::String>("setChallengeNumber").ToLocalChecked()
      , New<v8::FunctionTemplate>(setChallengeNumber)->GetFunction()
    );

    Set(target
      , New<v8::String>("setDifficultyTarget").ToLocalChecked()
      , New<v8::FunctionTemplate>(setDifficultyTarget)->GetFunction()
    );

    Set(target
      , New<v8::String>("setMinerAddress").ToLocalChecked()
      , New<v8::FunctionTemplate>(setMinerAddress)->GetFunction()
    );

    Set(target
      , New<v8::String>("hashes").ToLocalChecked()
      , New<v8::FunctionTemplate>(hashes)->GetFunction()
    );

    gpuminer = new GpuMiner;

    node::AtExit(cleanup, gpuminer);
  }

  NODE_MODULE(gpumining, Init)

}
