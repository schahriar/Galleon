var mailin = require('mailin');

/* Start the Mailin server. */
module.exports.listen = function(port){
	mailin.start({
		port: port,
		disableWebhook: true,
		logLevel: 'error'
	});
}

/* Event emitted when a connection with the Mailin smtp server is initiated. */
mailin.on('startMessage', module.exports.stream);

/* Event emmited when data chunk is sent */
// Useful for Galleon's internal functions such as ratelimiting and bandwidth limiting
mailin.on('data', module.exports.rawStream);

/* Event emitted after a message was received and parsed. */
mailin.on('message', module.exports.mail);