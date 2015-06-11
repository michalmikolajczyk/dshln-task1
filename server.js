'use strict';

var debug = require('debug')('dev');
var restify = require('restify');
var favicons = require('./src/favicons');

var server = restify.createServer();

// server.on('uncaughtException', function(err) {
//   debug('Caught exception: ' + err);
// });

function unknownMethodHandler(req, res) {
  if (req.method.toLowerCase() === 'options') {
    var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With']; // added Origin & X-Requested-With

    if (res.methods.indexOf('OPTIONS') === -1) {
      res.methods.push('OPTIONS');
    }

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
    res.header('Access-Control-Allow-Methods', res.methods.join(', '));
    res.header('Access-Control-Allow-Origin', req.headers.origin);

    return res.send(204);
  } else {
    return res.send(new restify.MethodNotAllowedError());
  }
}

server.on('MethodNotAllowed', unknownMethodHandler);

server.use(restify.fullResponse());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.jsonp());
server.use(restify.bodyParser({ mapParams: false }));

server.get('/get', favicons.getFavicon);
// server.head('/get', favicons.getFavicon);

var port = Number(process.env.PORT || 8080);

server.listen(port, function() {
  debug('%s listening at %s', server.name, server.url);
});