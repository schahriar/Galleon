/**
 * Runs Galleon Server.
 *
 * @param  {Config} Object
 */

/* -- Modules -- */
// Core
var incoming = require('./fleet/incoming/incoming');
//var outgoing = require('./fleet/outgoing/outgoing');

var outbound = require('./fleet/outgoing/outbound');
var queue = require('./fleet/outgoing/queue');

var Database = require('./fleet/connection');
var modulator = require('./bin/modulator/master');
// -------------------------------------------

// Query
var GalleonQuery = {
	delete: 	require('./query/delete'),
	mark:   	require('./query/mark'),
	get:    	require('./query/get'),
	getattachment: require('./query/get.attachment'),
	linkattachment: require('./query/link.attachment'),
	unlinkattachment: require('./query/unlink.attachment'),
}

// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require('util');
var path 		 = require("path");
var fs			 = require('fs');
var osenv 		 = require('osenv');

// Utilities
var _ = require('lodash');
var portscanner  = require('portscanner');
var validator = require('validator');
var bcrypt = require('bcryptjs');
var colors = require('colors'); // Better looking error handling
var Spamc = require('spamc-stream');
/* -- ------- -- */

var pass = true, fail = false;

var Defaults = {
	// Ports
	ports: {
		incoming: 25,
		outgoing: 587,
		server: 3080
	},
	dock: false,
	noCheck: false,
	verbose: true,
	env: {
		ssl: {
			use: false
		}
	}
};

var Galleon = function(config, callback){

	// Internal
	var _this = this;
	if(!config) callback = config;
	if(!callback) callback = function(){};

	// Defaults
	// if((!config.port)||(typeof config.port != 'number')||(config.port % 1 != 0)) config.port = 25; // Sets to default port
		config = _.defaultsDeep(config, Defaults);
	//

	if((!config.environment) && (!config.env)) {
		try {
			config.environment = JSON.parse(fs.readFileSync(path.resolve(osenv.home(), '.galleon/', 'galleon.conf'), 'utf8'));
		}catch(e) {
			console.trace(e);
			if(e) throw new Error("Failed to resolve Environment. If you are using the API pass the environment in the config object.");
		}
	}

	// Attach environment to Galleon Object
	_this.environment = config.environment || config.env;

	// Assign module environment
	_this.environment.modulator = modulator;
	// Assign modules
	_this.environment.modules = _this.environment.modulator.load(_this.environment.modules);

	Database(_this.environment.connections, function(error, connection){
		if(config.verbose) console.log("Connection attempted".yellow);
		if(error) {
			console.error("Connection error!".red);
			callback(error);
			throw error;
		}

		if(config.verbose) console.log("Database connection established".green);
		// Add database connection to `this`
		_this.connection = connection;

		if(!config.noCheck) {
			var ports = config.ports;
			InternalMethods.checkPorts([ports.incoming, ports.server], function(check){
				if(check && config.verbose) console.log("All requested ports are free");

				if(config.dock) {
					_this.dock(function(error, incoming) {
						_this.emit('ready', error, incoming);
						callback(error, incoming, connection);
					});
				}else{
					// Emit -ready- event
					_this.emit('ready');
					callback(error, connection);
				}
			});
		}else _this.emit('ready');
	})

	// Load front-end modules
	_this.environment.modulator.launch(_this.environment.modules['frontend'], osenv.tmpdir(), function(){
		if(config.verbose) console.log("FRONTEND MODULES LAUNCHED".green, arguments)
	})

	eventEmmiter.call(this);
}

var InternalMethods = {
	checkPorts: function(ports, callback){
		var check = pass;

		// There should be a better way to do this
		ports.forEach(function(port, index, array){
			var finalCallback = undefined;

			if(array.length-1 <= index) finalCallback = callback;
			InternalMethods.checkPort(port, function(test) {
				if(test == fail) {
					check = fail;
					// Log failure
					console.warn("Port " + port + " is occupied");
				}
			}, check, finalCallback);
		});
	},

	checkPort: function(port, callback, check, finalCallback) {
		portscanner.checkPortStatus(port, '127.0.0.1', function(error, status) {
			if(error) console.error(error);

			if(finalCallback){
				if(status == 'open') finalCallback(fail);
				else finalCallback(check);
			}else{
				// Status is 'open' if currently in use or 'closed' if available
				if(status == 'open') callback(null, fail);
				else if (status == 'closed') callback(null, pass);
			}

		})
	}
}

util.inherits(Galleon, eventEmmiter);

/* - STARTUP METHODS - */
Galleon.prototype.dock = function(callback){
	// Internal
	if(!callback) callback = function(){};

	this.spamc = new Spamc('localhost', 783, 20);
	var INCOMING = new incoming(this.environment);
	INCOMING.listen(Defaults.ports.incoming, this.connection, this.spamc); // Start SMTP Incoming Server

	//var OUTGOING = new outgoing();
	//OUTGOING.listen(587); // Start SMTP Incoming Server - Sets to default port for now

	// ERROR | INCOMING | OUTGOING //
	callback(undefined, INCOMING);
}

Galleon.prototype.server = function(callback) {
	var Server = require('./api/server');

	// Internal
	if(!callback) callback = function(){};

	Server(this.environment, Defaults.ports.server, this.connection, this);
	callback(undefined, true);
}
/* - --------------- - */

/* - DISPATCH METHOD - */
Galleon.prototype.dispatch = function(mail, callback, connection){
	connection = connection || this.connection;
	var QUEUE = new queue(this.environment);
	QUEUE.add(connection, mail, Defaults, callback);
}
/* - ---------------- - */

/* - USER MANAGEMENT - */
Galleon.prototype.createUser = function(user, callback) {
	var _this = this;

	// Internal
	if(!callback) callback = function(){};

	// REGEX to match:
	// * Between 4 to 64 characters
	// * Special characters allowed (_)
	// * Alphanumeric
	// * Must start with a letter
	if(!validator.isEmail(user.email))
		return callback("Invalid email");

	// REGEX to match:
	// * Between 2 to 256 characters
	// * Special characters allowed (&)
	// * Alpha
	if((!validator.matches(user.name, /^([ \u00c0-\u01ffa-zA-Z-\&'\-])+$/))&&(validator.isLength(user.name,2,256)))
		return callback("Invalid name");

	// Check if name is provided
	if(!user.name)
		return callback("No name provided\nTry -> --name=\"<name>\"");

	// REGEX to match:
	// * Between 6 to 20 characters
	// * Special characters allowed (@,$,!,%,*,?,&)
	// * Alphanumeric
	if(!validator.matches(user.password, /^(?=.*[a-zA-Z])[A-Za-z\d$@$!%*?&]{6,20}/))
		return callback("Invalid password");

	bcrypt.hash(user.password, 10, function(error, hash) {
		if(error) return res.status(500).json({ error: error });

		_this.connection.collections.users.create({
			email: user.email,
			name: user.name,
			isAdmin: user.isAdmin || false,
			password: hash,
		},function(error, user){
			if(error) return callback(error);
			callback(null, user);
		})
	});
}

Galleon.prototype.listUsers = function(options, callback) {
	// Internal
	if(!callback) callback = function(){};

	this.connection.collections.users.find().limit(options.limit || 50).exec(callback);
}

Galleon.prototype.removeUser = function(query, callback) {
	// Internal
	if(!callback) callback = function(){};

	if(query) this.connection.collections.users.destroy(query).exec(callback);
	else callback("NO QUERY");
}

Galleon.prototype.changePassword = function(user, newPassword, oldPassword, callback, forceChange) {
	var self = this;
	// Internal
	if(!callback) callback = function(){};
	if(!user) callback("User not found!");

	// REGEX to match:
	// * Between 6 to 20 characters
	// * Special characters allowed (@,$,!,%,*,?,&)
	// * Alphanumeric
	if(!validator.matches(newPassword, /^(?=.*[a-zA-Z])[A-Za-z\d$@$!%*?&]{6,20}/))
		return callback("Invalid password - Length must be between 6 to 20 characters");

	if(!forceChange) {
		bcrypt.compare(oldPassword, user.password, function(error, result) {
			if(error) return callback("Current password does not match!");
			bcrypt.hash(newPassword, 10, function(error, hash) {
				if(hash)
					self.connection.collections.users.update({ email: user.email }, { password: hash }).exec(callback);
				else
					return callback("INCORRECT PASSWORD");
			})
		})
	}else{
		bcrypt.hash(newPassword, 10, function(error, hash) {
			if(hash)
				self.connection.collections.users.update({ email: user.email }, { password: hash }).exec(callback);
			else
				return callback("INCORRECT PASSWORD");
		})
	}
}
/* - --------------- - */

/* - EMAIL MANAGEMENT - */
Galleon.prototype.query = function(method, query, callback) {
	// Check if a corresponding Function is available
	if(!GalleonQuery[method.toLowerCase()]) return callback("Method not found!");
	if(GalleonQuery[method.toLowerCase()].constructor !== Function) return callback("Method not found!");

	// Log Query
	console.log(colors.green(method.toUpperCase()), query);

	// Execute Query
	GalleonQuery[method.toLowerCase()](this, query, callback);
}
/* - ---------------- - */

module.exports = Galleon;
