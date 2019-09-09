const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const EthereumBip44 = require('ethereum-bip44');


let infura_apikey = 'ErkMqD1W4xWqfkfqNBnt';
let mnemonic = 'capable pill sample bench announce hole cushion horror direct pond exist garden';


let wallet = EthereumBip44.fromPrivateSeed('xprv9s21ZrQH143K3DPrXctSwPAzKax5NFTy36bNqAVAVw9N9A9we92hTx4YPepXD4oWTpveB9NwzynjoAVK38LLrNdQibP6oR4DxooBpdaySLq');
let wallet0pub = wallet.getAddress(0);
console.log('deploying from:', wallet0pub);

// console.log(Object.getOwnPropertyNames(wallet.key.derive(`m/44'/60'/0'/0/1`)));
// let wallet0pub = wallet.getAddress(0);
console.log(wallet.key.derive(`m/44'/60'/0'/0/1`).privateKey);
console.log(wallet.key.derive(`m/44'/60'/0'/0/1`).publicKey);

// ex_priv: 'xprvA1bX37a7HCjVzkyaRkCpm2EVg1snu8X6dhfMGBUbYvALdE8s2sBNLNRr9A6BaFAMbGtQ4bqRaqnBmHqTHrPwp1zWbj71BXuaDkVGwpzqG8j'
// ex_pub: 'xpub6EasSd717aHoDF43Xmjq8ABEE3iHJbEwzvax4ZtD7FhKW2U1aQVctAkKzSYYUNyLrpCBtPbvTszKXYJjNCL6hreqzu5ZzCUTzhzUppCabAt'

// let mnemonic = 'accuse extend real hat they eagle worry brisk earn drop deputy guide';
// testrpc --mnemonic "my test example" --accounts 50
module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    // truffle migrate --network live
    ropsten: {
      provider: new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/'+infura_apikey),
      gas: 4700000,
      network_id: 3
    },
    demo: {
      host: '138.197.106.138',
      port: 8545,
      network_id: '*'
    }
  }
};

// module.exports = {
//   networks: {
//     development: {
//       host: 'localhost',
//       port: 8545,
//       network_id: '*' // Match any network id
//     }
//   }
// };
