/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");

// Utilities
var mailin = require('mailin');
/* -- ------- -- */

//
/* -------------- Module Human description -------------- */
/*

		Incoming module will map all incoming
	connection to the specified port (SMTP - 25 Unless
	stated otherwise) and provide raw and processed
	data (in form of an object) through an event based
	API.
	
		Mails have three different states and events
	(connection, stream, mail) which can be programmed
	to do almost all the functions a mail server would
	require. There will be additions to functions of
	each in this module in each version but they will
	mostly be opt-in additions rather than opt-out.
	
	Note: SpamAssasin is currently disabled through
		  ~mailin~ and would most probably be
		  implemented in Galleon itself for direct
		  access.

*/
/* -------------- ------------------------ -------------- */
//

/* * Performance (Lightweight server - Tier 1 Connection - 0.5GB RAM)
----------------
* Inbound Mail (Gmail to Server): 3-4 seconds
* Inbound Mail (Hotmail to Server): 2-3 seconds
* Inbound Mail (Google Apps Mail to Server): 2-3 seconds
* Inbound Mail (Server to Server): TO BE TESTED - estimate: 3-4 seconds

Note: Includes parsing time
----------------
*/

/* Start the Mailin server. */
var Incoming = function(port){
	eventEmmiter.call(this);
	
	this.port = port;
}

util.inherits(Incoming, eventEmmiter);

Incoming.prototype.listen = function (port) {
	var _this = this;
	
    mailin.start({
		port: port,
		disableWebhook: true,
		logLevel: 'error',
		disableSpamScore: true // Gave up on this for now #Revisit #WeHadHashTagFirst
	});
	
	_this.emit("ready", mailin);  
	
	// Bind events
	/*
		We'll later use this file to extend Mailin functionality without a need to fork the entire repository
	*/
	mailin.on('startMessage', function(connection){ _this.emit('connection', connection) }); // Event emitted when a connection with the Mailin smtp server is initiated. //
	mailin.on('data', function(connection, chunk){ _this.emit('stream', connection, chunk) }); // Event emmited when data chunk is sent - Useful for Galleon's internal functions such as ratelimiting and bandwidth limiting
	// Event emitted after a message was received and parsed //
	mailin.on('message', function(connection, data, content){
		// Tiny bit of arranging
		var organized = data;
		
		if(data.from.constructor === Array)
			organized.from = data.from[0].address;
		
		if(data.to.constructor === Array)
			organized.to   = data.to[0].address;
		
		organized.fromAll = data.from;
		organized.toAll = data.to;
		
		_this.emit('mail', connection, organized, content);
	});
};

module.exports = Incoming;