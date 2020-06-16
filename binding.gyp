{
'conditions': [
    [ 'OS=="win"', {'variables': {'obj': 'obj'}},
    {'variables': {'obj': 'o'}}]],

"targets": [
 

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
    }

]
}
