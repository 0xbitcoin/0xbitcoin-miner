

/*
  Every time the software is booted, the vault password
  must be provided to unlock the encrypted private key store


*/
module.exports =  {


    init()
    {
      this.isUnlocked = false ;

    },

    getAccount()
    {

      return {
        public_address: '0x2B63dB710e35b0C4261b1Aa4fAe441276bfeb971',
        private_key: 'a6c4ca8fdbb9bf6c4424832fe970c034282a3a8ae31339b7b5c64478dbebf366'
      }

    }


}
