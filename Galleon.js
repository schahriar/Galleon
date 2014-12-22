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

var Galleon = function(config, requirements){
	eventEmmiter.call(this);
	
	// Defaults
	//
	if(!config) config = new Object;
	if(!requirements) requirements = new Object;
	
	Galleon.methods.ready();
}

util.inherits(Galleon, eventEmmiter);

Galleon.methods = {
	ready: function(){
		this.emit('ready', true, null);
	},
	dock: function(config, callback, requirements){
		var self = Galleon.prototype.dock;

		// Defaults
		//
		if(!config) config = new Object;
		if(!requirements) requirements = new Object;
		
		if((!config.port)||(typeof config.port != 'number')||(config.port % 1 != 0)) config.port = 25; // Sets to default port
		//
		
		// Require Database connection
		if(!requirements.databaseConnection) return handlers.needs.databaseConnection(self, config, [config, callback], requirements);
		
		// Require a port check
		if(!requirements.portCheck) return handlers.needs.portCheck(self, config.port, [config, callback], requirements);

		var INCOMING = new incoming();
		INCOMING.listen(config.port, requirements.databaseConnection, new Spamc()); // Start SMTP Incoming Server
		
		//var OUTGOING = new outgoing();
		//OUTGOING.listen(587); // Start SMTP Incoming Server - Sets to default port for now
		
		// ERROR | INCOMING | OUTGOING //
		callback(undefined, INCOMING);
	},
	
	dispatch: function(mail, config, callback, requirements){
		var self = Galleon.prototype.dispatch;
		
		// Defaults
		//
		if(!config) config = new Object;
		if(!requirements) requirements = new Object;
		//
		
		// Require Database connection
		if(!requirements.databaseConnection) return handlers.needs.databaseConnection(self, config, [mail, config, callback], requirements);
		
		var QUEUE = new queue();
		QUEUE.add(requirements.databaseConnection, mail, config);
	},
	
	server: function(options, callback, requirements) {
		var self = Galleon.prototype.server;

		// Defaults
		//
		if(!options) options = new Object;
		if(!requirements) requirements = new Object;
		
		// Require Database connection
		if(!requirements.databaseConnection) return handlers.needs.databaseConnection(self, options, [options, callback], requirements);
		
		Server(options.port, requirements.databaseConnection);
		
		callback(undefined, true);
	}
}

//
// All needs are fulfilled here (works almost like promises but better organized)
//
handlers.needs = {
	
	databaseConnection: function(call, options, args, requirements){
		if(handlers.needs.unique.databaseConnection){
			// Unique connection exists
			// Fulfill with the existing connection
			requirements.databaseConnection = connection;
			handlers.needs.fulfill(call, args, requirements);
		}else{
			Database(function(error, connection){
				console.log("Connection attempted".warn);
				if(error) throw error;

				console.log("Database connection established".success);
				// Otherwise return the database connection
				requirements.databaseConnection = connection;
				// Make connection unique
				handlers.needs.unique.databaseConnection = connection;

				handlers.needs.fulfill(call, args, requirements);
			})
		}
	},
	
	portCheck: function(call, port, args, requirements){
		
		// Check if port is valid
		if((!port)||(port.constructor !== Number))
			return handlers.error.fatal('#Needs-PortCheck-!Port', port);
		
		// Run a port scan
		portscanner.checkPortStatus(port, '127.0.0.1', function(error, status) {
			
			// Status is 'open' if currently in use or 'closed' if available
			if(status == 'open') return handlers.error.fatal('#Needs-PortCheck-Port-Occupied',port);
			
			// Otherwise return a pass to original
			requirements.portCheck = pass;
			handlers.needs.fulfill(call, args, requirements);
			
		})
	},
	
	fulfill: function(call, args, requirements){
		
		if(!(args.constructor === Array)){ // Possibly passed a single parameter instead of array
			handlers.error.warn('#Needs-fulfill-!Array', args.constructor);
			args = [args]; // Fix it cuz that's how we handle errooors
		}
		
		args.push(requirements);
		call.apply(null,args);
	},
	
	unique: {
		databaseConnection: undefined
	}
}

//
// All error handling is done through this Group
//
handlers.error = {
	fatal: function(code, arg){
		var text = this.codes[code];
		console.log(code.debug.bgWhite.bold +' '+ text.error, arg) /* "Fatal only on fatal errors" - Captain Obvious */
	},
	warn: function(code, arg){
		var array = this.codes[code];
		// Warn only if the action is corrected otherwise throw error or fatal
		console.log(array[0].warn);
		
		// Add info line if passed to the function
		if(!!array[1]) console.log(array[1].info);
	},
	
	codes: {
		'#Needs-PortCheck-!Port': 'Port should be a whole number\nYou Sir passed %s',
		'#Needs-PortCheck-Port-Occupied': 'Can\'t access port %s\n try stoping other SMTP services such as Postfix running on port 25',
		'#OUTBOUND-Transporter-New-Failed': 'Failed to create new Outbound Transporter\n%s',
		'#Needs-fulfill-!Array': ['Need handler requires array arguments\nYou Sir passed %s', 'But guess what? We corrected your mistake!']
		
	}
}

Galleon.prototype.dock = Galleon.methods.dock;
Galleon.prototype.dispatch = Galleon.methods.dispatch;
Galleon.prototype.server = Galleon.methods.server;

module.exports = Galleon;