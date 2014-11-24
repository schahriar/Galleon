/**
 * Runs Galleon Server.
 *
 * @param  {Config} Object
 */

/* -- Modules -- */
// Core
var incoming = require('./incoming/incoming.js');

// Essential
var portscanner = require('portscanner');

// Debug
var colors = require('colors'); // Better looking error handling
/* -- ------- -- */

var handlers = {};
var pass = true, fail = false;

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	info: 'green',
	data: 'grey',
	help: 'cyan',
	warn: 'yellow',
	debug: 'grey',
	bgWhite: 'bgWhite',
	bold: 'bold',
	error: 'red'
});

module.exports = {
	incoming: undefined,
	watch: function(config, callback, requirements){
		var self = module.exports.watch;

		// Defaults
		//
		if(!config) config = new Object;
		if(!requirements) requirements = new Object;
		
		if((!config.port)||(typeof config.port != 'number')||(config.port % 1 != 0)) config.port = 25; // Sets to default port
		//
		
		// Require a port check
		if(!requirements.portCheck) return handlers.needs.portCheck(self, config.port, [config], requirements);
		console.log('PortCheck Successful');
		this.incoming = incoming.listen(config.port); // Start SMTP Incoming Server
		console.log('Incoming is ' this.incoming);
		callback(this.incoming);
	}
}

//
// All needs are fulfilled here (works almost like promises but better organized
//
handlers.needs = {
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
		'#Needs-fulfill-!Array': ['Need handler requires array arguments\nYou Sir passed %s', 'But guess what? We corrected your mistake!'],
		
	}
}