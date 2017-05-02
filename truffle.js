// Allows us to use ES6 in our migrations and tests.
require('babel-register')

const HDWalletProvider = require("truffle-hdwallet-provider")
const fs = require("fs")

// First read in the secrets.json to get our mnemonic
let secrets
let mnemonic
if(fs.existsSync("secrets.json")) {
  secrets = JSON.parse(fs.readFileSync("secrets.json", "utf8"))
  mnemonic = secrets.mnemonic
} else {
  console.log("No secrets.json found. If you are trying to publish EPM " +
              "this will fail. Otherwise, you can ignore this message!")
  mnemonic = "" 
}

//HD Wallet params
var providerUrlRopsten = "https://ropsten.infura.io"
var providerUrlKovan = "https://kovan.infura.io"

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    ropsten: {
      network_id: 3,
      provider: new HDWalletProvider(mnemonic, providerUrlRopsten)
    },
    kovan: {
      network_id: 4,
      provider: new HDWalletProvider(mnemonic, providerUrlKovan)
    }
  }
}
