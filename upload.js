const request = require('request-promise');
const config = require('config');
const EthereumBip44 = require('ethereum-bip44');
let Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider('http://192.168.12.226:8545'));

let eyesUri = config.get('uri');

let walletAddress;
if (config.privateSeed) {
  let wallet = EthereumBip44.fromPrivateSeed(config.privateSeed);
  walletAddress = wallet.getAddress(0);
} else {
  // default test address
  let wallet = web3.eth.accounts.privateKeyToAccount(`0x${process.env.TPK}`);
  walletAddress = wallet.address;
}

let abis = JSON.stringify({
  terrapin: require('./build/contracts/EventManager'),
  event: require('./build/contracts/Event'),
  ticket: require('./build/contracts/Ticket')
});

let { terrapinAddress } = require('./build/info.json');

let options = {
  method: 'POST',
  uri: eyesUri,
  body: {
    abis,
    terrapinAddress,
    walletAddress
  },
  json: true // Automatically stringifies the body to JSON
};

// securly send abis to "eyes"
request(options)
  .then((res) => {
    if (res.success !== true) throw new Error('Upload Failed');
    console.log('Upload Complete');
  })
  .catch((err) => {
    console.log('\nError: ', err.message, '\n');
  });
