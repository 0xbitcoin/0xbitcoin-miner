{
  ## for windows, be sure to do node-gyp rebuild -msvs_version=2013,
  ## and run under a msvs shell


  ## for linux,  node-gyp configure build --target=v8.9.4

  ## for all targets
  'conditions': [
    [ 'OS=="win"', {'variables': {'obj': 'obj'}},
    {'variables': {'obj': 'o'}}]],




  "targets": [
{
 "target_name": "hello-addon",

 "sources": [


 "sph/sph_shavite.h",
 "sph/sph_simd.h",
 "sph/sph_keccak.h",

 "cpp/cpuminer-config.h",
 "cpp/miner.h",
 "cpp/cuda_helper.h",
 
    "cpp/sha/cuda_sha256d.cu",
    "cpp/hello.cpp",
  ],

 'rules': [{
     'extension': 'cu',
     'inputs': ['<(RULE_INPUT_PATH)'],
     'outputs':[ '<(INTERMEDIATE_DIR)/<(RULE_INPUT_ROOT).<(obj)'],
     'conditions': [
      [ 'OS=="win"',
        {'rule_name': 'cuda on windows',
         'message': "compile cuda file on windows",
         'process_outputs_as_sources': 0,
         'action': ['nvcc -c <(_inputs) -o  <(_outputs)'],
         },
       {'rule_name': 'cuda on linux',
         'message': "compile cuda file on linux",
         'process_outputs_as_sources': 1,
         'action': ['nvcc','-ccbin','clang-3.8','-Xcompiler','-fpic','-c',
            '<@(_inputs)','-o','<@(_outputs)'],
    }]]}],

   'conditions': [
    [ 'OS=="mac"', {
      'libraries': ['-framework CUDA'],
      'include_dirs': ['/usr/local/include'],
      'library_dirs': ['/usr/local/lib'],
    }],
    [ 'OS=="linux"', {
      'libraries': ['-lcuda', '-lcudart'],
      'include_dirs': ['/usr/local/include'],
      'library_dirs': ['/usr/local/lib', '/usr/local/cuda/lib64'],
    }],
    [ 'OS=="win"', {
      'conditions': [
        ['target_arch=="x64"',
          {
            'variables': { 'arch': 'x64' }
          }, {
            'variables': { 'arch': 'Win32' }
          }
        ],
      ],
      'variables': {
        'cuda_root%': '$(CUDA_PATH)'
      },
      'libraries': [
        '-l<(cuda_root)/lib/<(arch)/cuda.lib',
        '-l<(cuda_root)/lib/<(arch)/cudart.lib',
      ],
      "include_dirs": [
        "<(cuda_root)/include",
      ],
    }, {
      "include_dirs": [
        "/usr/local/cuda/include"
      ],
    }]
  ]
}
]
}
