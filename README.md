# Dashlane task1

Favicon API

This is an API. It can be accessed

## Build and run

To build the app, clone the repo, then in the root directory run:

```
npm install
```

To run the app:
```
node server.js
```

Debug mode:
```
DEBUG=dev node server.js
```

At this point, the app should be accessible at http://localhost:8080/get?domain=facebook.com

## Use the hosted version

There is a hosted version available on Heroku:
http://dshln-task1.herokuapp.com/get

e.g.
http://dshln-task1.herokuapp.com/get?domain=wikipedia.org

## Normal Mode

If only the domain query parameter (required) is provided, the app should return a JSON

## Lucky Stream Mode

If another parameter, `lucky` is set to a value, like 1, then instead of a JSON, a image stream is returned, directly to the favicon:
http://dshln-task1.herokuapp.com/get?domain=dashlane.com&lucky=1

## General thoughs about the project

This is a small API, built on Restify. 

### The strong parts

It is cool, because it uses 7 strategies to try to obtain favicons:

* get favicon
* get favicon with a www. domain prefix
* get apple touch icon
* get apple touch icon with a www. domain prefix
* parse the html for `<link rel="icon" href="... >`
* parse the html for `<link rel="shortcut icon" href="... >`
* parse the html for `<link rel="apple-touch-icon" href="... >`

The API tries the different strategies in parallel. The execution relies on promises, using the library RSVP.
There is a cache module, which at the moment is just a simple object. The cache is written to when the results are returned.

The Lucky Stream Mode is particularly interesting. Basically, the app performs only one GET request: when it aims to parse the HTML. Otherwise, HEAD requests are used.
In Lucky Stream Mode, another GET request is made - directly for the favicon, if it is available, otherwise for the apple touch icon. That image is piped directly to the response - in this mode, the server acts as a light proxy.
**This mode allows to send back the image, without having to buffer it**

During development, I relied on nodemon:
```
DEBUG=dev nodemon server.js
```

### Areas for improvement

* The domain is only checked for existence, but it is not parsed. Invalid domains names might effect in unexpected results
* Cache is naive
* The code for strategies is not really DRY

### Questions and answers

#### Set up of a cache (filesystem ? database ?), to not have to fetch the images on the website each time

Redis could be used, as a first thought. I am using a simple object cache now - it builds up until the app is restarted.

#### If this cache was to be implemented, what strategies to update it should the icons of the website change?

Cron-like jobs, adding a timestamp with the cache object, query parameters to update the cache...

#### If 2 requests for the same domain are received in a short time interval, is there a way to deal with them in a smart way?

Cached data could be treated as promises. The promise would be made on the first request. If another request arrives, before the first returns, it could be directed to the same, yet unresolved promise.
I have a working implementation of that pattern in a browser app.

#### How to choose the best image? Is it better to try to parallelize the different strategies or do them sequentially?

This really depends on the agenda. Should favicons be favored over apple-touch-icon, like they are in my app? With parallel requests, users get the results returned fast, though some requests may resolve unnecessary. Probably a considerate priority schema, would effect in an optimal approach.

#### Rate limiting (per domain, per ip?)

The cache is set on an object, it can be easily extended.

#### Possible architecture, if we were to scale to millions of users / requests per day...

* Using tools like cluster https://nodejs.org/api/cluster.html would allow to run the app on more than one thread per machine. If using heroku, extending to new instances is a breeze
* Using a cache layer in the form of a webservice (or several webservices), would help to minimise the costs of actual processing power
* A reverse proxy, such as Varnish, maybe even combined with a load balancer, could help a lot too, even as an alternative to the cache layer
* HTML parsing should be non-blocking (perhaps executed in a child process), together with all other blocking code
* The app itself should be monitored for memory consumption, request latencies, throughput boundaries should be measured
* The combined use of tools such as: Papertrail (logging + automatic reaction), New Relic, Heroku Metrics, Librato, with automated notifications to email, would help to monitor the system
* The app should operate in respect to modern industry best practices, e.g. those outlined in the reactive manifesto
