var request = require('request');

function getFavicon(req, res, next) {

  var first = {
    method: 'GET',
    uri: 'http://' + req.query.domain + '/favicon.ico',
  };
  
  return req
    .pipe(request(first, function (error, response, body) {
      if (error) {
        throw (error);
      }
    }))
    .pipe(res);

  // res.writeHead(200, {
  //   'Content-Type': response.headers['content-type']
  // });
  // res.write(body);
  // return res.end();
  

}

exports.getFavicon = getFavicon;