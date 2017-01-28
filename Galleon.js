/**
 * Runs Galleon Server.
 *
 * @param  {Env} Object
 */

/* -- Modules -- */
// Core
var incoming = require('./fleet/incoming/incoming');
//var outgoing = require('./fleet/outgoing/outgoing');

var outbound = require('./fleet/outgoing/outbound');
var queue = require('./fleet/outgoing/queue');

var Database = require('./fleet/connection');
var Modulator = require('./bin/modulator');
// -------------------------------------------

// Query
var GalleonQuery = {
	delete: 	require('./query/delete'),
	mark:   	require('./query/mark'),
	get:    	require('./query/get'),
	getattachment: require('./query/get.attachment'),
	linkattachment: require('./query/link.attachment'),
	unlinkattachment: require('./query/unlink.attachment'),
	clean: require('./query/clean.js'),
	restore: require('./query/restore.js')
};

// Essential
var EventEmitter = require('events').EventEmitter;
var util         = require('util');
var path 		 = require("path");
var fs			 = require('fs');
var osenv 		 = require('osenv');

// Utilities
const _ = require('lodash');
const portscanner  = require('portscanner');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const async = require('async');
const colors = require('colors'); // Better looking error handling
const Spamc = require('spamc-stream');
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
	ssl: {
		use: false
	}
};

class Galleon extends EventEmitter {
	constructor(env, callback) {
		super();
		var environment = {};
	
		if((!callback) && (typeof(env) === 'function')) {
			callback = env;
			env = undefined;
		}
		if((!callback) || (typeof(callback) !== 'function')) {
			callback = function() {};
		}

		if((typeof(env) !== 'object') || (!env.connections)) {
			try {
				environment = JSON.parse(fs.readFileSync(path.resolve(osenv.home(), '.galleon/', 'galleon.conf'), 'utf8'));
			}catch(e) {
				console.trace(e);
				if(e) throw new Error("Failed to resolve Environment. If you are using the API pass an environment object as the first parameter.");
			}
		}
		
		// Set Spamc
		this.spamc = new Spamc('localhost', 783, 60);
		
		// Defaults
		environment = _.defaultsDeep(environment || {}, env);
		environment = _.defaultsDeep(environment || {}, Defaults);
		//
	
		// Attach environment to Galleon Object
		this.environment = environment;
	
		// Assign module environment
		this.environment.modulator = new Modulator();
		// Assign modules -> IF Environment is set to Safe Mode Ignore All Modules
		if(this.environment.safemode === true) {
			this.environment.modules = {};
		}else{
			this.environment.modules = this.environment.modulator.load();
		}
	
		Database(this.environment.connections, (error, connection) => {
			if(environment.verbose) console.log("Connection attempted".yellow);
			if(error) {
				console.error("Connection error!".red);
				if(callback) callback(error);
				else throw error;
			}
	
			if(environment.verbose) console.log("Database connection established".green);
			// Add database connection to `this`
			this.connection = connection;
	
			if(!environment.noCheck) {
				var ports = environment.ports;
					Galleon.checkPorts([ports.incoming, ports.server], (check) => {
					if(check && environment.verbose) console.log("All requested ports are free");
	
					if(environment.dock) {
						this.dock((error, incoming) => {
							this.emit('ready', error, incoming);
							callback(error, incoming, connection);
						});
					}else{
						// Emit -ready- event
						this.emit('ready');
						callback(error, connection);
					}
				});
			}else this.emit('ready');
		});
	
		// Load front-end modules
		this.environment.modulator.launch('frontend', osenv.tmpdir(), function(){
			if(environment.verbose) console.log("FRONTEND MODULES LAUNCHED".green, arguments);
		});
	}
	
	dock(callback) {
		// Internal
		if(!callback) callback = function(){};
	
		var INCOMING = new incoming(this.environment);
		INCOMING.listen(this.environment.ports.incoming, this.connection, this.spamc); // Start SMTP Incoming Server
	
		//var OUTGOING = new outgoing();
		//OUTGOING.listen(587); // Start SMTP Incoming Server - Sets to default port for now
	
		// ERROR | INCOMING | OUTGOING //
		callback(undefined, INCOMING);
	}
	
	server(callback) {
		var Server = require('./api/server');
	
		// Internal
		if(!callback) callback = function(){};
	
		Server(this.environment, this.environment.ports.server, this.connection, this);
		callback(undefined, true);
	}
	
	query(method, query, callback) {
		// Check if a corresponding Function is available
		if(!GalleonQuery[method.toLowerCase()]) return callback(new Error("Method not found!"));
		if(GalleonQuery[method.toLowerCase()].constructor !== Function) return callback(new Error("Method not found!"));
	
		// Log Query
		if(this.environment.verbose) console.log(colors.green(method.toUpperCase()), query);
	
		// Execute Query
		GalleonQuery[method.toLowerCase()](this, query, callback);
	}
	
	static checkPorts(ports, callback){
		var check = pass;

		async.mapSeries(ports, (port, callback) => {
			portscanner.checkPortStatus(port, '127.0.0.1', callback);
		}, (error, responses) => {
			if (error) return callback(error);
			
			for (let i = 0; i < responses.length; i++) if (responses[i] === false) {
				console.warn(`Port ${ports[i]} is occupied`);
				return callback(null, false);
			}
			
			callback(null, true);
		});
	}
};

/* - DISPATCH METHOD - */
Galleon.prototype.dispatch = function(mail, callback, connection){
	connection = connection || this.connection;
	var QUEUE = new queue(this.environment);
	QUEUE.add(connection, mail, this.environment, callback);
};
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
		return callback(new Error("Invalid email"));

	// REGEX to match:
	// * Between 2 to 256 characters
	// * Special characters allowed (&)
	// * Alpha
	if((!validator.matches(user.name, /^([ \u00c0-\u01ffa-zA-Z-\&'\-])+$/))&&(validator.isLength(user.name,2,256)))
		return callback(new Error("Invalid name"));

	// Check if name is provided
	if(!user.name)
		return callback(new Error("No name provided\nTry -> --name=\"<name>\""));

	// REGEX to match:
	// * Between 6 to 20 characters
	// * Special characters allowed (@,$,!,%,*,?,&)
	// * Alphanumeric
	if(!validator.matches(user.password, /^(?=.*[a-zA-Z])[A-Za-z\d$@$!%*?&]{6,20}/))
		return callback(new Error("Invalid password"));

	bcrypt.hash(user.password, 10, function(error, hash) {
		if(error) return callback(error);

		_this.connection.collections.users.create({
			email: user.email,
			name: user.name,
			isAdmin: user.isAdmin || false,
			password: hash,
		},function(error, user){
			if(error) return callback(error);
			callback(null, user);
		});
	});
};

Galleon.prototype.listUsers = function(options, callback) {
	// Internal
	if(typeof(options) === 'function') {
		callback = options;
		options = {};
	}else if(!options) options = {};
	if(!callback) callback = function(){};

	this.connection.collections.users.find().limit(options.limit || 50).exec(callback);
};

Galleon.prototype.removeUser = function(query, callback) {
	// Internal
	if(!callback) callback = function(){};
	// IF Query is email
	if(typeof(query) === 'string') query = { email: query };

	if(query) this.connection.collections.users.destroy(query).exec(callback);
	else callback(new Error("NO QUERY"));
};

Galleon.prototype.changePassword = function(user, newPassword, oldPassword, callback, forceChange) {
	var self = this;
	// Internal
	if(!callback) callback = function(){};
	if(!user) callback(new Error("No user argument (email) passed!"));
	if(user.email) user = user.email;

	// REGEX to match:
	// * Between 6 to 20 characters
	// * Special characters allowed (@,$,!,%,*,?,&)
	// * Alphanumeric
	if(!validator.matches(newPassword, /^(?=.*[a-zA-Z])[A-Za-z\d$@$!%*?&]{6,20}/))
		return callback(new Error("Invalid password - Length must be between 6 to 20 characters"));

	if(!forceChange) {
		self.connection.collections.users.findOne({ email: user }).exec(function(error, user){
			if(!user) callback(new Error("User Not found!"));
			bcrypt.compare(oldPassword, user.password, function(error, result) {
				if(error || !result) return callback(new Error("Current password does not match!"));
				bcrypt.hash(newPassword, 10, function(error, hash) {
					if(hash)
						self.connection.collections.users.update({ email: user.email }, { password: hash }).exec(function(error){
							if(error) return callback(new Error("Password update failed"));
							self.connection.collections.users.findOne({ email: user.email }).exec(callback);
						});
					else
						return callback(new Error("INCORRECT PASSWORD"));
				});
			});
		});
	}else{
		bcrypt.hash(newPassword, 10, function(error, hash) {
			if(hash)
				self.connection.collections.users.update({ email: user }, { password: hash }).exec(callback);
			else
				return callback(new Error("INCORRECT PASSWORD"));
		});
	}
};
/* - --------------- - */

module.exports = Galleon;
