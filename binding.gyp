{
  "targets": [
     
    {
      "target_name": "gpumineraddonsimple",
      "sources": [ "cpp/gpuminersimple.cc" ],
       "include_dirs" : [
         "<!(node -e \"require('nan')\")"
         ]
    }
  ]

}
