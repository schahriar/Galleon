var mailin = require('mailin');
var event = require('events').EventEmitter();

/* Start the Mailin server. */
module.exports.listen = function(port){
	mailin.start({
		port: port,
		disableWebhook: true,
		logLevel: 'error'
	});
}

module.export.events = new event;
/* Event emitted when a connection with the Mailin smtp server is initiated. */
mailin.on('startMessage', function(connection){ module.export.events.emit('connection', connection) });

/* Event emmited when data chunk is sent */
// Useful for Galleon's internal functions such as ratelimiting and bandwidth limiting
mailin.on('data', function(connection, data, content){ module.export.events.emit('stream', connection, chunk) });

/* Event emitted after a message was received and parsed. */
mailin.on('message', function(connection, data, content){ module.export.events.emit('mail', connection, data, content) });