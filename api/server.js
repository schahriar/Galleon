// HTTP/HTTPS
var https = require('https');
var http = require('http');
// Express
var express = require('express');
var inspect = require('util').inspect;
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var authentication = require('./middleware/authentication');
var crypto = require('crypto');
// File System
var fs = require('fs');

var ACCESS = require('./routes/access');
var API = require('./routes/api');

// Make Database connection
// & Start the server
module.exports = function (environment, port, connection, instance) {
  var app = express();

  if (!port) port = 3000; // Default port;

  app.set("models", connection.collections);
  app.set("connections", connection.connections);
  app.set("galleon", instance);
  app.set("environment", environment);
  app.set("secret", environment.secret || crypto.randomBytes(20).toString('hex'));

  // SSL Detection, Automatically switches between HTTP and HTTPS on start
  if (environment.ssl.use) {
    var SSL_CONFIG;
    try {
      SSL_CONFIG = {
        key: fs.readFileSync(environment.ssl.api.key, 'utf8'),
        cert: fs.readFileSync(environment.ssl.api.cert, 'utf8')
      }
      https.createServer(SSL_CONFIG, app).listen(port);
    } catch (e) {
      http.createServer(app).listen(port);
    }
  } else {
    http.createServer(app).listen(port);
  }

  // Allow API access outside origin (This is an API after all)
  app.use(function (req, res, next) {
    // Allow for Webmail interface
    // Echo Back Origin if header is provided (Equivalent to * but allows Credentials)
    if (req.get('origin') && (typeof req.get('origin') === 'string')) {
      res.header("Access-Control-Allow-Origin", req.get('origin'));
    } else res.header("Access-Control-Allow-Origin", req.protocol + '://' + environment.domain + ":2095");

    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  });


  // uncomment after placing your favicon in /public
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  app.use(compress());
  if (environment.verbose) app.use(logger('dev'));

  // If Environment secret is not set assign a random secret on every restart
  app.use(cookieParser(app.get('secret')));
  // Secret middleware
  app.use((req, res, next) => {
    req.envSecret = app.get('secret');
    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: false
  }));

  // Database middleware
  app.use(function (req, res, next) {
    req.galleon = app.get("galleon");
    req.database = {
      models: app.get("models"),
      connections: app.get("connections")
    }
    req.environment = app.get("environment");
    next();
  });

  app.use(authentication({
    login: '/access/login',
    logout: '/access/logout'
  }));
  app.use('/access', ACCESS);
  app.use('/', API);

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handlers

  // development error handler
  // will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
      console.trace(err);
      res.status(err.status || 500);
      res.json({
        message: err.message,
        error: inspect(err, {
          showHidden: true,
          depth: 5
        })
      })
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: JSON.stringify(err)
    })
  });
}
