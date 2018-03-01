

module.exports =  {

  init( )
  {
      this.debug = true
  },


  log(message)
  {
    if(this.debug){console.log(message)}
  },

}
