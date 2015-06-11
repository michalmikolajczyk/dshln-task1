'use strict';

var request = require('request');
var debug = require('debug')('dev');
var RSVP = require('rsvp');
var cache = require('./cache');

function getFavicon(req, res, next) {
  debug('starting getFavicon');

  if (!req || !req.query || !req.query.domain) {
    return res.send(400, {
      "code": "badRequest",
      "message": "domain query parameter required"
    });
  }

  var results = {};
  
  var strategies = [
    {
      name: 'domainFavicon',
      handler: function (fulfill, reject) {

        if (results.favicon) {
          return reject('favicon already in results');
        }
        var newRequest = {
          method: 'HEAD',
          uri: 'http://' + req.query.domain + '/favicon.ico',
        };

        var callback = function (error, response, body) {
          if (error) {
            debug('error');
            return reject(error);
          }
          if (response.statusCode === 200 && !results.favicon) {
            results.favicon = newRequest.uri;
          }
          fulfill();
        };

        request(newRequest, callback);
      }
    },
    {
      name: 'wwwDomainFavicon',
      handler: function (fulfill, reject) {
        if (req.query.domain.split('.')[0] === 'www') {
          return reject('domain already contains www');
        }
        if (results.favicon) {
          return reject('favicon already in results');
        }
        var newRequest = {
          method: 'HEAD',
          uri: 'http://www.' + req.query.domain + '/favicon.ico',
        };
        var callback = function (error, response, body) {
          if (error) {
            debug('error');
            return reject(error);
          }
          if (response.statusCode === 200 && !results.favicon) {
            results.favicon = newRequest.uri;
          }
          fulfill();
        };

        request(newRequest, callback);
      }
    },
    {
      name: 'domainAppleIcon',
      handler: function (fulfill, reject) {
        if (results.appleTouchIcon) {
          return reject('apple touch icon already in results');
        }
        var newRequest = {
          method: 'HEAD',
          uri: 'http://' + req.query.domain + '/apple-touch-icon.png',
        };
        var callback = function (error, response, body) {
          if (error) {
            debug('error');
            return reject(error);
          }
          if (response.statusCode === 200 && !results.appleTouchIcon) {
            results.appleTouchIcon = newRequest.uri;
          }
          fulfill();
        };
        request(newRequest, callback);
      }
    },
    {
      name: 'wwwDomainAppleIcon',
      handler: function (fulfill, reject) {
        if (results.appleTouchIcon) {
          return reject('apple touch icon already in results');
        }
        if (req.query.domain.split('.')[0] === 'www') {
          return reject('domain already contains www');
        }
        var newRequest = {
          method: 'HEAD',
          uri: 'http://www.' + req.query.domain + '/apple-touch-icon.png',
        };
        var callback = function (error, response, body) {
          if (error) {
            debug('error');
            return reject(error);
          }
          if (response.statusCode === 200 && !results.appleTouchIcon) {
            results.appleTouchIcon = newRequest.uri;
          }
          fulfill();
        };
        request(newRequest, callback);
      }
    },
    {
      name: 'parseHTML',
      handler: function (fulfill, reject) {
        if (results.favicon && results.appleTouchIcon) {
          return reject('favicon already in results');
        }
        var newRequest = {
          method: 'GET',
          uri: 'http://' + req.query.domain,
        };
        var callback = function (error, response, body) {
          if (error) {
            debug('error');
            return reject(error);
          }
          if (response.statusCode === 200 && (!results.favicon || !results.appleTouchIcon)) {
            var icon, shortcutIcon, appleTouchIcon, href;
            try {
              icon = body.match(/<link.*rel="icon" [^>]*>/)[0];
              if (icon && !results.favicon) {
                href = icon.match(/href="([^"]*)"/)[1];
                if (href[0] !== 'h' || href[1] !== 't' || href[2] !== 't' || href[3] !== 'p') {
                  // handle absolute paths, relative to the pathname
                  if (href[0] !== '/') {
                    href = '/' + href;
                  }
                  href = newRequest.uri + href;
                }
                results.favicon = href;
              }
            } catch (e) {
              // debug(e);
            }
            try {
              shortcutIcon = body.match(/<link.*rel="shortcut icon" [^>]*>/)[0];
              if (shortcutIcon && !results.favicon) {
                href = shortcutIcon.match(/href="([^"]*)"/)[1];
                if (href[0] !== 'h' || href[1] !== 't' || href[2] !== 't' || href[3] !== 'p') {
                  // handle absolute paths, relative to the pathname
                  if (href[0] !== '/') {
                    href = '/' + href;
                  }
                  href = newRequest.uri + href;
                }
                results.favicon = href;
              }
            } catch (e) {
              // debug(e);
            }
            try {
              appleTouchIcon = body.match(/<link.*rel="apple-touch-icon" [^>]*>/)[0];
              if (appleTouchIcon && !results.appleTouchIcon) {
                href = appleTouchIcon.match(/href="([^"]*)"/)[1];
                if (href[0] !== 'h' || href[1] !== 't' || href[2] !== 't' || href[3] !== 'p') {
                  // handle absolute paths, relative to the pathname
                  if (href[0] !== '/') {
                    href = '/' + href;
                  }
                  href = newRequest.uri + href;
                }
                results.appleTouchIcon = href;
              }
            } catch (e) {
              // debug(e);
            }
            // debug(link);
          }
          fulfill();
        };
        request(newRequest, callback);
      }
    }

  ];

  var processResults = function() {
    if (!results.favicon && !results.appleTouchIcon) {
      return res.send(404, {code: "noFaviconFound", message: "No favicon or apple touch icon found."});
    }
    cache[req.query.domain] = results;
    if (req.query.lucky) {
      var requestDetails;
      debug('lucky you');
      requestDetails = {
        method: 'GET',
        uri: (results.favicon ? results.favicon : results.appleTouchIcon),
      };
      return req
        .pipe(request(requestDetails, function (error, response, body) {
          if (error) {
            throw (error);
          }
        }))
        .pipe(res);
    }
    return res.send(results);
  };

  debug(req.query.domain);
  debug('check cache');
  // console.log(cache);
  if (cache[req.query.domain]) {
    debug('found in cache');
    results = cache[req.query.domain];
    return processResults();
  } else {
    debug('cache empty');
  }

  var promises = [];
  strategies.forEach(function (strategy) {
    
    if (strategy.name && typeof strategy.handler === 'function') {
      debug('processing strategy' + strategy.name);
      promises.push(new RSVP.Promise(strategy.handler));
    }

  });

  RSVP
    .all(promises)
    .catch(function (reason) {
      debug(reason);
    })
    .finally(function () {
      debug('fulfill');
      processResults();
    });



}

exports.getFavicon = getFavicon;