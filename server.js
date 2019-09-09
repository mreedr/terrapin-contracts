let restify = require('restify');
let corsMiddleware = require('restify-cors-middleware');
let mongoose = require('mongoose');
let bluebird = require('bluebird');
let User = require('./UserApi');

let server = restify.createServer();

const cors = corsMiddleware({
  origins: ['http://localhost:3000'],
  allowHeaders: ['*']
  // exposeHeaders: ['API-Token-Expiry']
});

mongoose.connect('mongodb://localhost/terrapin', { promiseLibrary: bluebird });

let user = new User();

server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

let abis = JSON.stringify({
  terrapin: require('./build/contracts/EventManager'),
  event: require('./build/contracts/Event'),
  ticket: require('./build/contracts/Ticket')
});

// used by truffles deploy process
module.exports = (terrapinAddr) => {
  server.get('/contract-info', (req, res, next) => {
    res.json({
      abis,
      terrapinAddr
    });
    next();
  });

  server.post('/login', (req, res, next) => {
    const { username, password } = req.body;
    user.getUser(username, password)
      .then((userAccount) => {
        res.send(userAccount);
        return next();
      })
      .catch((err) => {
        return user.register(username, password)
          .then((userAccount) =>{
            res.send(userAccount);
            return next();
          });
      });
  });

  server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
  });
};
