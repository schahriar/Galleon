/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");
var fs 			 = require('fs');
var path		 = require('path');

// Utilities
var mailin  = require('mailin');
var async   = require('async');
var shortId = require('shortid');
var _ 		= require('lodash');

// Functions
var create = require("./create");

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

// ** OLD DATA -> REQUIRES UPDATE
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
var Incoming = function(environment){
	this.environment = environment;
	console.log(this.environment.paths);

	eventEmmiter.call(this);
}

util.inherits(Incoming, eventEmmiter);

Incoming.prototype.listen = function (port, databaseConnection, Spamc) {
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
	mailin.on('startMessage', function(connection){
		_this.emit('connection', connection);
	}); // Event emitted when a connection with the Mailin smtp server is initiated. //

	mailin.on('data', function(connection, chunk){ _this.emit('stream', connection, chunk) }); // Event emmited when data chunk is sent - Useful for Galleon's internal functions such as ratelimiting and bandwidth limiting
	// Event emitted after a message was received and parsed //

	mailin.on('message', function(connection, data, raw){
		// Will not use SPAMASSASIN if the process is not available
		try {
			Spamc.report(raw, function (error, labResults) {
				if(error) console.log("SMAPC", error);
				create(_this, databaseConnection, connection, data, raw, labResults);
			});
		}catch(error) {
			if(error) console.log("SMAPC-NOT-FOUND", error);
			create(_this, databaseConnection, connection, data, raw);
		}

	});
};

Incoming.prototype.attach = function(databaseConnection, eID, attachments) {
	var self = this;
	var populatedAttachments = [];
	async.forEach(attachments, function(attachment, callback) {
		attachment.id   = eID + "_" + shortId.generate();
		attachment.path = path.resolve(self.environment.paths.attachments, attachment.id);

		fs.writeFile(attachment.path, attachment.content, function(err) {
			if(err) return callback(err);
			populatedAttachments.push({
				id: 	  attachment.id,
				cid:	  attachment.contentId,
				fileName: attachment.fileName,
				path: 	  attachment.path,

				transferEncoding: attachment.transferEncoding,
				contentType: attachment.contentType,
				checksum: attachment.checksum,
				length:   attachment.length
			});
			callback();
		});
	}, function(err) {
		if (err) return console.error(err);

		databaseConnection.collections.mail.update({ 'eID': eID }, {
			attachments: populatedAttachments
		}, function(error, model){
			if(error) console.error("EMAIL BOUNCED", error);
			// Fix association
			console.log("EMAIL RECEIVED FOR:", model[0].association);
		});
	});
}

module.exports = Incoming;
