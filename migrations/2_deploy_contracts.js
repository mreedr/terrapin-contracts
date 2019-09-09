const fs = require('fs');

// let ConvertLib = artifacts.require('./ConvertLib.sol');
let EventManager = artifacts.require('./EventManager.sol');

module.exports = function(deployer) {
  // deployer.deploy(ConvertLib);
  // deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(EventManager)
    .then(() => {
      return new Promise((resolve, reject) => {
        // write the address to build/info.json
        fs.writeFile(`${__dirname}/../build/info.json`, JSON.stringify({
          terrapinAddress: EventManager.address
        }, null, '  '), (err) => {
          if (err) return reject(err);
          return resolve();
        });
      });
    });
};
