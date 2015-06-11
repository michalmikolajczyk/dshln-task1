var restify = require('restify');
var favicons = require('./src/favicons');

var server = restify.createServer();

function unknownMethodHandler(req, res) {
  if (req.method.toLowerCase() === 'options') {
    console.log('received an options method request');
    var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With', 'X-Nowness-Language']; // added Origin & X-Requested-With

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

server.use(restify.fullResponse());
server.on('MethodNotAllowed', unknownMethodHandler);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.jsonp());
server.use(restify.bodyParser({ mapParams: false }));

server.get('/get', favicons.getFavicon);
server.head('/get', favicons.getFavicon);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});