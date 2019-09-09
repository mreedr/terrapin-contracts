let Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider('http://192.168.12.226:8545'));
let pasync = require('pasync');
let moment = require('moment');

let EventManager = artifacts.require('./EventManager.sol');
let Event = artifacts.require('./Event.sol');
let Ticket = artifacts.require('./Ticket.sol');

let requestPromise = require('request-promise');

web3.utils.toAsciiOriginal = web3.utils.toAscii;
web3.utils.toAscii = function(input) { return web3.utils.toAsciiOriginal(input).replace(/\u0000/g, ''); };

function deployed() {
  return EventManager.deployed();
}

function guidGenerator() {
  var S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+'-'+S4()+'-'+S4()+'-'+S4()+'-'+S4()+S4()+S4());
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let wei = 1000000000000000000;
let MAX_TICKETS = 6;

contract('EventManager', function(accounts) {
  before(function() {
    // let eventName = 'String Cheese Incident @ Colorado';
    let eventName = 'String Cheese';
    let basePrice = 1; // in cents
    let startDate = moment().unix();
    let endDate = moment().add(1, 'days').unix();

    let terrapin;
    return deployed().then((_terrapin) => {
      terrapin = _terrapin; // make global for use in later "then"s
      this.terrapinInstance = terrapin;
      console.log('herers');
      return terrapin.createEvent(
        eventName, MAX_TICKETS, basePrice, startDate, endDate,
        {
          from: accounts[1],
          gas: 4700000
        });
    })
      .then(() => {
        console.log('djddj');
      });
      // .then(() => terrapin.getEvents.call())
      // .then((eventAddresses) => {
      //   let eventInstance = Event.at(eventAddresses[0]);
      //   return pasync.eachSeries(new Array(MAX_TICKETS), () => {
      //     let accountNum = getRandomInt(3, 40);
      //     return eventInstance.printTicket(accounts[accountNum], 'GA', {
      //       from: accounts[1],
      //       gas: 4700000
      //     });
      //   }).then(() => eventInstance);
      // })
      // .then((eventInstance) => {
      //   this.eventInstance = eventInstance;
      // });
  });

  before(function() {
    this.nextTicket = 0;
    let ticketInstances = [];
    return this.eventInstance.getTickets.call()
      .then((ticketAddresses) => {
        return pasync.eachSeries(ticketAddresses, (ticketAddress) => {
          ticketInstances.push(Ticket.at(ticketAddress));
        });
      })
      .then(() => {
        // getTicketInstance function allows easy way to get unused ticekts
        // by preceeding tests
        this.getTicketInstance = () => {
          return new Promise((resolve) => {
            resolve(ticketInstances[this.nextTicket++]);
          });
        };
      });
  });

  before(function() {
    return requestPromise('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD')
      .then((res) => {
        this.etherPrice = JSON.parse(res).USD;
      });
  });

  it.only('should buy and print a ticket', function() {
    let eventInstance = this.eventInstance;
    let etherPrice = this.etherPrice;

    return eventInstance.getTicketPrice.call(web3.utils.fromAscii('GA'))
      .then((price) => {
        console.log('price', price);
        let fee = 5;
        let totalPrice = price + fee;

        let etherNeeded = (totalPrice / etherPrice);
        let weiNeeded = etherNeeded * wei;

        console.log('etherPrice:', etherPrice);
        console.log('wei sent:', weiNeeded);

        return eventInstance.buyAndPrintTicket(web3.utils.fromAscii('GA'), {
          from: accounts[2],
          gas: 4700000,
          value: weiNeeded
        });
      })
      .then(() => {
        let logEvent = eventInstance.Log();
        logEvent.watch((err, result) => {
          if (err) console.log(err);
          console.log('log:', result.args);
        });
        return logEvent;
      })
      .then((logEvent) => {
        // let boughtEvent = eventInstance.Log();
        let boughtEvent = eventInstance.Bought();
        return new Promise((resolve, reject) => {
          boughtEvent.watch((err, result) => {
            if (err) console.log(err);
            console.log('bought:', result.args);
            boughtEvent.stopWatching();
            logEvent.stopWatching();
            resolve();
          });
        });
      })
      .then(() => {
        console.log('done');
      });
  });

  it('should buy a ticket', function() {
    let ticketInstance, owner;

    return this.getTicketInstance()
      .then((_ticketInstance) => {
        ticketInstance = _ticketInstance;
        return ticketInstance.buyTicket({
          from: accounts[2],
          gas: 4700000,
          value: wei * 20
        });
      })
      .then(() => {
        return ticketInstance.owner.call().then((_owner) => {
          owner = _owner;
        });
      })
      .then(() => {
        let boughtEvent = ticketInstance.Bought();
        return new Promise((resolve, reject) => {
          boughtEvent.watch((err, result) => {
            if (err) return reject(err);
            assert(Boolean(result.args.status) === true);
            resolve();
            boughtEvent.stopWatching();
          });
        });
      })
      .then(() => {
        return ticketInstance.owner.call().then((newOwner) => {
          assert(owner !== newOwner);
        });
      });
  });

  it('should call masterBuy from master account', function() {
    let ticketInstance;

    return this.getTicketInstance()
      .then((_ticketInstance) => ticketInstance = _ticketInstance)
      .then(() => {
        return ticketInstance.masterBuy(accounts[1], {
          from: accounts[0],
          gas: 4700000
        });
      })
      .then(() => ticketInstance.isForSale.call())
      .then((_isForSale) => {
        return ticketInstance.owner.call().then((_owner) => {
          assert(_owner === accounts[1]);
          assert(_isForSale === false);
        });
      });
  });

  it('should set is for sale', function() {
    let ticketInstance, owner;

    return this.getTicketInstance()
      .then((_ticketInstance) => {
        ticketInstance = _ticketInstance;
        return ticketInstance.buyTicket({
          from: accounts[2],
          gas: 4700000,
          value: wei * 20
        });
      })
      .then(() => {
        return ticketInstance.owner.call().then((_owner) => {
          owner = _owner;
        });
      })
      .then(() => {
        let boughtEvent = ticketInstance.Bought();
        return new Promise((resolve, reject) => {
          boughtEvent.watch((err, result) => {
            if (err) return reject(err);
            assert(Boolean(result.args.status) === true);
            resolve();
            boughtEvent.stopWatching();
          });
        });
      })
      .then(() => {
        return ticketInstance.owner.call().then((newOwner) => {
          assert(owner !== newOwner);
        });
      })
      .then(() => {
        return ticketInstance.setIsForSale(true, {
          from: accounts[2],
          gas: 4700000
        });
      })
      .then(() => ticketInstance.isForSale.call())
      .then((isForSale) => {
        assert(isForSale);
      });
  });

  it('should lookup all events created by user', function() {
    return this.terrapinInstance.getEventsByOwner.call(accounts[1])
      .then((eventAddresses) => {
        assert(eventAddresses.includes(this.eventInstance.address))
      });
  });

});
