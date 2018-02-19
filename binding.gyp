{
  "targets": [

    {
      "target_name": "gpuminer_addon_alpha",
      "sources": [ "cpp/gpumineralpha.cc" ],
       "include_dirs" : [
         "<!(node -e \"require('nan')\")"
         ]
    }

  ]

}
