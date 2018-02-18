{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "lib/gpuminer.cc" ],
       "include_dirs" : [
         "<!(node -e \"require('nan')\")"
         ]
    }
  ]

}
