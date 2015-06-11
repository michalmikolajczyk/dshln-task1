'use strict';

var request = require('request');
var debug = require('debug')('dev');
var RSVP = require('rsvp');

function getFavicon(req, res, next) {
  debug('starting getFavicon');
  var requestDetails;

  if (!req || !req.query || !req.query.domain) {
    return res.send(400, {
      "code": "badRequest",
      "message": "domain query parameter required"
    });
  }
  debug(req.query.domain);

  if (req.query.lucky) {
    debug('lucky you');
    requestDetails = {
      method: 'HEAD',
      uri: 'http://' + req.query.domain + '/favicon.ico',
    };
    return req
      .pipe(request(requestDetails, function (error, response, body) {
        if (error) {
          throw (error);
        }
      }))
      .pipe(res);
  }

  var results = {};

  var promises = [];

  var strategies = [
    {
      name: 'domainFavicon',
      handler: function (fulfill, reject) {

        requestDetails = {
          method: 'HEAD',
          uri: 'http://' + req.query.domain + '/favicon.ico',
        };

        var callback = function (error, response, body) {
          if (error) {
            debug('error');
            return reject(error);
          }
          results.favicon = requestDetails.uri;
          fulfill();
        };

        request(requestDetails, callback);
      }
    },
    {
      name: 'wwwDomainFavicon',
      handler: function (fulfill, reject) {
        if (req.query.domain.split('.')[0] === 'www') {
          return reject('domain already contains www');
        }
        requestDetails = {
          method: 'HEAD',
          uri: 'http://www.' + req.query.domain + '/favicon.ico',
        };
        var callback = function (error, response, body) {
          if (error) {
            debug('error');
            return reject(error);
          }
          debug(response);
          if (response && response.statusCode === 200) {
            results.favicon = requestDetails.uri;
          }
          fulfill();
        };

        request(requestDetails, callback);
      }
    }
    
    // 'domainAppleIcon',
    // 'wwwDomainAppleIcon',
    // 'parseHTMLforLinkTypeAppleTouchIcon', 
    // 'parseHTMLforLinkTypeShortcutIcon',
    // 'parseHTMLforLinkTypeIcon'
  ];

  strategies.forEach(function (strategy) {
    
    if (strategy.name && typeof strategy.handler === 'function') {
      debug('processing strategy' + strategy.name);
      promises.push(new RSVP.Promise(strategy.handler));
    }

  });

  RSVP
    .all(promises)
    .finally(function () {
      debug('fulfill');
      if (!results.favicon && !results.apppleTouchIcon) {
        return res.send(404, {code: "noFaviconFound", message: "No favicon or apple touch icon found."});
      }
      return res.send(results);
    });
}

exports.getFavicon = getFavicon;