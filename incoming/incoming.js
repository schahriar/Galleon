/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");

// Utilities
var mailin = require('mailin');
/* -- ------- -- */

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
	mailin.on('message', function(connection, data, content){ _this.emit('mail', connection, data, content) });
};

module.exports = Incoming;