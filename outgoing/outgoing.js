/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");

// Foundations
var mailin = require('mailin');
/* -- ------- -- */

//
/* -------------- Module Human description -------------- */
/*

		Outgoing module will take care of outbound mails
	initiated through an inbound connection from mail
	clients or internal programs using the api.
	
		This will not only enable mail clients to
	connect to Galleon and send emails but also will
	enable the ability to build a REST Api where
	necessary.
	
		We use ~mailin~ in this module as well to catch
	messages sent to the specified protocol
	(587 by default or 465 when secured) and will forward
	it to ~outbound~ if autosend is enabled in options.

*/
/* -------------- ------------------------ -------------- */
//

/* * Performance
----------------
NO TESTS YET
----------------
*/


/* Start the Mailin server for Outgoing connections. */
var Outgoing = function(port){
	eventEmmiter.call(this);
	
	this.port = port;
}

util.inherits(Outgoing, eventEmmiter);

Outgoing.prototype.listen = function (port) {
	var _this = this;
	
    mailin.start({
		port: port,
		disableWebhook: true,
		logLevel: 'error',
		disableSpamScore: true
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

module.exports = Outgoing;