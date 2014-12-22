/**
 * Runs Galleon Server.
 *
 * @param  {Config} Object
 */

/* -- Modules -- */
// Core
var incoming = require('./fleet/incoming/incoming');
var outgoing = require('./fleet/outgoing/outgoing');

var outbound = require('./fleet/outgoing/outbound');
var queue = require('./fleet/outgoing/queue');

var Server = require('./seascape/server');
var Database = require('./fleet/connection');

// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");

// Utilities
var async = require("async");
var portscanner  = require('portscanner');
var colors = require('colors'); // Better looking error handling
var _ = require('lodash');
var Spamc = require('spamc');
/* -- ------- -- */

var handlers = {};
var pass = true, fail = false;

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	success: 'green',
	data: 'grey',
	help: 'cyan',
	warn: 'yellow',
	debug: 'grey',
	bgWhite: 'bgWhite',
	bold: 'bold',
	error: 'red'
});

var Globals = {};
var Defaults = {
	// Ports
	ports: { 
		incoming: 25,
		outgoing: 587,
		server: 3000
	},
	dock: false
};

var Galleon = function(config, callback){
	
	// Internal
	var _this = this;
	if(!config) callback = config;
	if(!callback) callback = function(){};
	
	// Defaults
	// if((!config.port)||(typeof config.port != 'number')||(config.port % 1 != 0)) config.port = 25; // Sets to default port
		_.defaults(config, Defaults);
		Defaults = config;
	//
	
	
	Database(function(error, connection){
		console.log("Connection attempted".warn);
		if(error) {
			console.error("Connection error!".error);
			callback(error);
			throw error;
		}
		
		console.log("Database connection established".success);
		
		var ports = Defaults.ports;
		InternalMethods.checkPorts([ports.incoming, ports.server], function(check){
			if(check) console.log("All requested ports are free");
			
			// Globalize database connection
			Globals.databaseConnection = connection;
			
			if(Defaults.dock) {
				Methods.dock(function(error, incoming) {
					_this.emit('ready', error, incoming);
					callback(error, incoming, connection);
				});
			}else{
				// Emit -ready- event
				_this.emit('ready');
				callback(error, connection);
			}
		});
	})
	
	eventEmmiter.call(this);
}

util.inherits(Galleon, eventEmmiter);

var Methods = {
	dock: function(callback){
		
		// Internal
		if(!callback) callback = function(){};

		var INCOMING = new incoming();
		INCOMING.listen(Defaults.ports.incoming, Globals.databaseConnection, new Spamc()); // Start SMTP Incoming Server
		
		//var OUTGOING = new outgoing();
		//OUTGOING.listen(587); // Start SMTP Incoming Server - Sets to default port for now
		
		// ERROR | INCOMING | OUTGOING //
		callback(undefined, INCOMING);
	},
	
	dispatch: function(mail, callback){
		var QUEUE = new queue();
		QUEUE.add(Globals.databaseConnection, mail, Defaults);
	},
	
	server: function(callback) {
		
		// Internal
		if(!callback) callback = function(){};
		
		Server(Defaults.ports.server, Globals.databaseConnection);
		callback(undefined, true);
	}
}

var InternalMethods = {
	checkPorts: function(ports, callback){
		var check = pass;
		
		// forEach is sync
		ports.forEach(function(port, index, array){
			var finalCallback = undefined;
			
			if(array.length-1 >= index) finalCallback = callback;
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
			
			// Status is 'open' if currently in use or 'closed' if available
			if(status == 'open') callback(null, fail);
			else if (status == 'closed') callback(null, pass);
			
			if(finalCallback){
				if(status == 'open') finalCallback(fail);
				else finalCallback(check);
			}
		})
	}
}

Galleon.prototype.dock = Methods.dock;
Galleon.prototype.dispatch = Methods.dispatch;
Galleon.prototype.server = Methods.server;

module.exports = Galleon;