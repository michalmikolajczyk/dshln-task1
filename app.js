var restify = require('restify');
var favicons = require('./src/favicons');

var server = restify.createServer();
server.get('/get', favicons.getFavicon);
server.head('/get', favicons.getFavicon);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});