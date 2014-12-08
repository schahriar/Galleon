var Database = require('../fleet/connection');
// Express
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var authentication = require('./middleware/authentication');

var routes = require('./routes/index');
var login = require('./routes/login');

var users = require('./routes/users');
var mail = require('./routes/mail');
var mailbox = require('./routes/mailbox');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('Your_very_secret_cookie_code'));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Database middleware
app.use(function (req, res, next) {
	req.database = { models: app.models, connections: app.connections }
	next();
});

app.use(authentication({login: '/login'}));

app.use('/', routes);
app.use('/login', login);

app.use('/users', users);
app.use('/mail', mail);
app.use('/mailbox', mailbox);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
		res.set("Connection", "close");
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
	res.set("Connection", "close");
});

// Make Database connection
// & Start the server
Database(function(connection){
	app.models = connection.collections;
	app.connections = connection.connections;
	
	app.listen(3000);
});