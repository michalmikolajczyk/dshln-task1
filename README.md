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

If another parameter, `lucky` is set to a value, like 1, then instead of a JSON, a stream is returned, directly to the favicon:
http://dshln-task1.herokuapp.com/get?domain=dashlane.com&lucky=1
