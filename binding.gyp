{
    'targets': [

      {
      "target_name": "cpuminer",
      "sources": [
        "cpp/cpuminer/addon.cc",
        "cpp/cpuminer/cpuminer.cpp",
        "cpp/cpuminer/solver.cpp",
        "cpp/cpuminer/sha3.c"
      ],
      'cflags_cc+': [ '-march=native', '-O3', '-std=c++17' ],
      "include_dirs": ["<!(node -e \"require('nan')\")"]
    },
    
    {
      'target_name': 'opencl',
      'defines': [
        'VERSION=0.4.5',
        'NOCL_REALEASE_DRIVER_ISSUES'
      ],
      'sources': [
        'cpp/gpuminer2/addon.cpp',
        'cpp/gpuminer2/types.cpp',
        'cpp/gpuminer2/common.cpp',
        'cpp/gpuminer2/commandqueue.cpp',
        'cpp/gpuminer2/context.cpp',
        'cpp/gpuminer2/device.cpp',
        'cpp/gpuminer2/event.cpp',
        'cpp/gpuminer2/kernel.cpp',
        'cpp/gpuminer2/memobj.cpp',
        'cpp/gpuminer2/pipe.cpp',
        'cpp/gpuminer2/platform.cpp',
        'cpp/gpuminer2/program.cpp',
        'cpp/gpuminer2/sampler.cpp',
        'cpp/gpuminer2/svm.cpp'
      ],
      'include_dirs' : [
        "<!(node -e \"require('nan')\")",
      ],
      'conditions': [
        ['OS=="mac"', {
          'include_dirs' : [
            "<!(echo $OPENCL_HEADER)",
           ],
          # 'make_global_settings': [
          #   ['CC', '/usr/bin/clang'],
          #   ['CXX', '/usr/bin/clang++'],
          # ],
          "xcode_settings": {
            'OTHER_CPLUSPLUSFLAGS' : ['-mavx','-O3','-std=c++11','-stdlib=libc++','-Wall'],
            'OTHER_LDFLAGS': ['-stdlib=libc++'],
            'MACOSX_DEPLOYMENT_TARGET': '10.10'
          },
          'libraries': ['-framework OpenCL'],
        }],
        ['OS in "linux freebsd openbsd solaris android"', {
          'variables' : {
            # AMD APP SDK
            'AMD_OPENCL_SDK' : '<!(echo $AMDAPPSDKROOT)',
            'AMD_OPENCL_SDK_INCLUDE' : '<(AMD_OPENCL_SDK)/include',
            'AMD_OPENCL_SDK_LIB' : '<(AMD_OPENCL_SDK)/lib/x86_64',

            # NVIDA CUDA SDK
            'NVIDA_CUDA_SDK' : '<!(echo ${CUDA_PATH:-/usr/local/cuda})',
            'NVIDA_CUDA_SDK_INCLUDE' : '<(NVIDA_CUDA_SDK)/include',
            'NVIDA_CUDA_SDK_LIB' : '<(NVIDA_CUDA_SDK)/lib64',
          },
          'include_dirs' : [
            "<(AMD_OPENCL_SDK_INCLUDE)", "<(NVIDA_CUDA_SDK_INCLUDE)"
          ],
          'library_dirs' : [
            "<(AMD_OPENCL_SDK_LIB)", "<(NVIDA_CUDA_SDK_LIB)"
          ],
          'libraries': ['-lOpenCL'],
          'cflags_cc': ['-std=c++11', '-Wall', '-O3', '-Wno-ignored-attributes']
        }],
        ['OS=="win"', {
          'variables' :
            {
              # AMD APP SDK
              'AMD_OPENCL_SDK' : '<!(echo %AMDAPPSDKROOT%)',
              'AMD_OPENCL_SDK_INCLUDE' : '<(AMD_OPENCL_SDK)\\include',
              'AMD_OPENCL_SDK_LIB' : '<(AMD_OPENCL_SDK)\\lib\\x86_64',

              # Intel OpenCL SDK
              'INTEL_OPENCL_SDK' : '<!(echo %INTELOCLSDKROOT%)',
              'INTEL_OPENCL_SDK_INCLUDE' : '<(INTEL_OPENCL_SDK)\\include',
              'INTEL_OPENCL_SDK_LIB' : '<(INTEL_OPENCL_SDK)\\lib\\x64',

              # NVIDA CUDA SDK
              'NVIDA_CUDA_SDK' : '<!(echo %CUDA_PATH%)',
              'NVIDA_CUDA_SDK_INCLUDE' : '<(NVIDA_CUDA_SDK)\\include',
              'NVIDA_CUDA_SDK_LIB' : '<(NVIDA_CUDA_SDK)\\lib\\x64',
            },
            'include_dirs' : [
              "<(AMD_OPENCL_SDK_INCLUDE)", "<(INTEL_OPENCL_SDK_INCLUDE)", "<(NVIDA_CUDA_SDK_INCLUDE)","<!(echo %OPENCL_HEADER%)",
            ],
            'library_dirs' : [
              "<(AMD_OPENCL_SDK_LIB)", "<(INTEL_OPENCL_SDK_LIB)", "<(NVIDA_CUDA_SDK_LIB)"
            ],
            'defines' : [
              # 'WIN32_LEAN_AND_MEAN',
              'VC_EXTRALEAN',
            ],
            'msvs_settings' : {
              'VCCLCompilerTool' : {
                'AdditionalOptions' : ['/O2','/Oy','/GL','/GF','/Gm-','/EHsc','/MT','/GS','/Gy','/GR-','/Gd']
              },
              'VCLinkerTool' : {
                'AdditionalOptions' : ['/OPT:REF','/OPT:ICF','/LTCG']
              },
            },
            'libraries': ['OpenCL.lib'],
          },
       ],
    ]
  }]
}
