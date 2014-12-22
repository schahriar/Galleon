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
var portscanner  = require('portscanner');
var colors = require('colors'); // Better looking error handling
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
	}
};

var Galleon = function(config, callback){
	// Defaults
	// if((!config.port)||(typeof config.port != 'number')||(config.port % 1 != 0)) config.port = 25; // Sets to default port
	//
	var _this = this;
	if(!config) callback = config;
	if(!callback) callback = function(){};
	
	
	Database(function(error, connection){
		console.log("Connection attempted".warn);
		if(error) {
			console.error("Connection error!".error);
			callback(error);
			throw error;
		}
		
		var ports = Defaults.ports;
		InternalMethods.checkPorts(ports.incoming, ports.server);

		console.log("Database connection established".success);
		// Globalize database connection
		Globals.databaseConnection = connection;
		
		// Emit -ready- event
		_this.emit('ready');
		callback(error, connection);
	})
	
	eventEmmiter.call(this);
}

util.inherits(Galleon, eventEmmiter);

var Methods = {
	dock: function(callback){
		// Require a port check
		if(!requirements.portCheck) return handlers.needs.portCheck(self, config.port, [config, callback], requirements);

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
		Server(Defaults.ports.server, Globals.databaseConnection);
		callback(undefined, true);
	}
}

var InternalMethods = {
	checkPorts: function(ports, callback){
		var check = pass;
		
		// forEach is sync
		ports.forEach(function(port){
			this.checkPort(port, function(test) {
				if(test == fail) {
					check = fail;
					// Log failure
					console.warn("Port " + port + " is occupied");
				}
			});
		});
		
		callback(check);
	},
					  
	checkPort: function(port, callback) {
		portscanner.checkPortStatus(port, '127.0.0.1', function(error, status) {
			if(error) console.error(error);
			
			// Status is 'open' if currently in use or 'closed' if available
			if(status == 'open') return callback(fail);
			else if (status == 'closed') return callback(pass);
		})
	}
}

Galleon.prototype.dock = Methods.dock;
Galleon.prototype.dispatch = Methods.dispatch;
Galleon.prototype.server = Methods.server;

module.exports = Galleon;