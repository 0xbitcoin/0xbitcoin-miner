#include "common.h"
#include <iostream>

namespace opencl {

class ScopedArrayBufferContents {
 public:
  explicit ScopedArrayBufferContents(const v8::ArrayBuffer::Contents& contents)
      : contents_(contents) {}
  ~ScopedArrayBufferContents() { free(contents_.Data()); }
  void* Data() const { return contents_.Data(); }
  size_t ByteLength() const { return contents_.ByteLength(); }

 private:
  const v8::ArrayBuffer::Contents contents_;
};

// TODO replace TypedArray with node::Buffer or v8::ArrayBuffer (same thing)
void getPtrAndLen(const Local<Value> value, void* &ptr, size_t &len)
{
  Nan::HandleScope scope;

  ptr=nullptr;
  len=0;
  if(!value->IsUndefined() && !value->IsNull()) {
    if(value->IsArray()) {
      // JS Array
      // std::cout<<"[getPtrAndLen] JS array"<<std::endl;
      // Local<Array> arr=value.As<Array>();
      // len=arr->Length();
      // can't access a pointer to JS Array data anymore...
    }
    else if(value->IsArrayBuffer()) {
      // std::cout<<"[getPtrAndLen] ArrayBuffer"<<std::endl;
      Local<Object> obj = Nan::To<Object>(value).ToLocalChecked();
      Local<ArrayBuffer> ta = obj.As<ArrayBuffer>();
      len=ta->ByteLength();
      ptr=ta->GetContents().Data();
    }
    else if(value->IsUint8Array()) {
      // WARNING node::Buffer is an augmented Uint8Array
      // std::cout<<"[getPtrAndLen] Uint8Array"<<std::endl;
      Local<Object> obj = Nan::To<Object>(value).ToLocalChecked();
      Local<Uint8Array> ui = obj.As<Uint8Array>();
      ArrayBuffer::Contents ab_c = ui->Buffer()->GetContents();
      len=ui->ByteLength();
      ptr=static_cast<char*>(ab_c.Data()) + ui->ByteOffset();
    }
    else if(value->IsTypedArray()) {
      // std::cout<<"[getPtrAndLen] TypedArray"<<std::endl;
      Local<Object> obj = Nan::To<Object>(value).ToLocalChecked();
      Local<TypedArray> ta = obj.As<TypedArray>();
      len=ta->ByteLength();
      ptr=static_cast<char*>(ta->Buffer()->GetContents().Data()) + ta->ByteOffset();
    }
    // else if(value->IsObject()) {
      // shouldn't be called...
      // std::cout<<"[getPtrAndLen] object"<<std::endl;
      /*Local<Object> obj = Nan::To<Object>(value).ToLocalChecked();
      String::Utf8Value name(obj->GetConstructorName());
      std::cout<<"  object name: "<<*name<<std::endl;
      if(!strcmp("Buffer",*name)) {
        std::cout<<"[getPtrAndLen] node::Buffer"<<std::endl;
        // node::Buffer
        ptr=node::Buffer::Data(obj);
        len=(int) node::Buffer::Length(obj);
      }*/
    // }
  }
}

const char* getExceptionMessage(const cl_int code) {
  switch (code) {
    case CL_SUCCESS:                            return "Success!";
    case CL_DEVICE_NOT_FOUND:                   return "Device not found.";
    case CL_DEVICE_NOT_AVAILABLE:               return "Device not available";
    case CL_COMPILER_NOT_AVAILABLE:             return "Compiler not available";
    case CL_MEM_OBJECT_ALLOCATION_FAILURE:      return "Memory object allocation failure";
    case CL_OUT_OF_RESOURCES:                   return "Out of resources";
    case CL_OUT_OF_HOST_MEMORY:                 return "Out of host memory";
    case CL_PROFILING_INFO_NOT_AVAILABLE:       return "Profiling information not available";
    case CL_MEM_COPY_OVERLAP:                   return "Memory copy overlap";
    case CL_IMAGE_FORMAT_MISMATCH:              return "Image format mismatch";
    case CL_IMAGE_FORMAT_NOT_SUPPORTED:         return "Image format not supported";
    case CL_BUILD_PROGRAM_FAILURE:              return "Program build failure";
    case CL_MAP_FAILURE:                        return "Map failure";
    case CL_MISALIGNED_SUB_BUFFER_OFFSET:       return "Misaligned sub-buffer offset";
    case CL_EXEC_STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST: return "Execution status error for events in wait list";
#ifdef CL_VERSION_1_2
    case CL_COMPILE_PROGRAM_FAILURE:            return "Compile program failure";
    case CL_LINKER_NOT_AVAILABLE:               return "Linker not available";
    case CL_LINK_PROGRAM_FAILURE:               return "Link program failure";
    case CL_DEVICE_PARTITION_FAILED:            return "Device partition failed";
    case CL_KERNEL_ARG_INFO_NOT_AVAILABLE:      return "Kernel argument info not available";
#endif
    case CL_INVALID_VALUE:                      return "Invalid value";
    case CL_INVALID_DEVICE_TYPE:                return "Invalid device type";
    case CL_INVALID_PLATFORM:                   return "Invalid platform";
    case CL_INVALID_DEVICE:                     return "Invalid device";
    case CL_INVALID_CONTEXT:                    return "Invalid context";
    case CL_INVALID_QUEUE_PROPERTIES:           return "Invalid queue properties";
    case CL_INVALID_COMMAND_QUEUE:              return "Invalid command queue";
    case CL_INVALID_HOST_PTR:                   return "Invalid host pointer";
    case CL_INVALID_MEM_OBJECT:                 return "Invalid memory object";
    case CL_INVALID_IMAGE_FORMAT_DESCRIPTOR:    return "Invalid image format descriptor";
    case CL_INVALID_IMAGE_SIZE:                 return "Invalid image size";
    case CL_INVALID_SAMPLER:                    return "Invalid sampler";
    case CL_INVALID_BINARY:                     return "Invalid binary";
    case CL_INVALID_BUILD_OPTIONS:              return "Invalid build options";
    case CL_INVALID_PROGRAM:                    return "Invalid program";
    case CL_INVALID_PROGRAM_EXECUTABLE:         return "Invalid program executable";
    case CL_INVALID_KERNEL_NAME:                return "Invalid kernel name";
    case CL_INVALID_KERNEL_DEFINITION:          return "Invalid kernel definition";
    case CL_INVALID_KERNEL:                     return "Invalid kernel";
    case CL_INVALID_ARG_INDEX:                  return "Invalid argument index";
    case CL_INVALID_ARG_VALUE:                  return "Invalid argument value";
    case CL_INVALID_ARG_SIZE:                   return "Invalid argument size";
    case CL_INVALID_KERNEL_ARGS:                return "Invalid kernel arguments";
    case CL_INVALID_WORK_DIMENSION:             return "Invalid work dimension";
    case CL_INVALID_WORK_GROUP_SIZE:            return "Invalid work group size";
    case CL_INVALID_WORK_ITEM_SIZE:             return "Invalid work item size";
    case CL_INVALID_GLOBAL_OFFSET:              return "Invalid global offset";
    case CL_INVALID_EVENT_WAIT_LIST:            return "Invalid event wait list";
    case CL_INVALID_EVENT:                      return "Invalid event";
    case CL_INVALID_OPERATION:                  return "Invalid operation";
    case CL_INVALID_GL_OBJECT:                  return "Invalid OpenGL object";
    case CL_INVALID_BUFFER_SIZE:                return "Invalid buffer size";
    case CL_INVALID_MIP_LEVEL:                  return "Invalid mip-map level";
    case CL_INVALID_GLOBAL_WORK_SIZE:           return "Invalid global work size";
    case CL_INVALID_PROPERTY:                   return "Invalid property";
#ifdef CL_VERSION_1_2
    case CL_INVALID_IMAGE_DESCRIPTOR:           return "Invalid image descriptor";
    case CL_INVALID_COMPILER_OPTIONS:           return "Invalid compiler options";
    case CL_INVALID_LINKER_OPTIONS:             return "Invalid linker options";
    case CL_INVALID_DEVICE_PARTITION_COUNT:     return "Invalid device partition count";
#endif
    default:                                    return "Unknown error";
  }
}

}

// namespace opencl
