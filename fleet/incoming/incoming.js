/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");
var fs 			 = require('fs');
var path		 = require('path');
var os			 = require('os');

// SMTP Mail Handling
var SMTPServer = require('smtp-server').SMTPServer;
var MailParser = require("mailparser").MailParser;

// Utilities
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

/* Start the SMTP server. */
var Incoming = function(environment){
	this.environment = environment;
	console.log(this.environment.paths);

	eventEmmiter.call(this);
}

util.inherits(Incoming, eventEmmiter);

Incoming.prototype.listen = function (port, databaseConnection, Spamc) {
	var _this = this;
	
	/*
	if (this.environment.ssl.use) {
		options.secureConnection = true;
		options.credentials = {
			key: fs.readFileSync(this.environment.ssl.incoming.key, 'utf8'),
			cert: fs.readFileSync(this.environment.ssl.incoming.cert, 'utf8')
		}
	}
	*/
	
	var ProcessMail = function INCOMING_EMAIL_PROCESSOR(session, callback){
		/* Find/Create a Spamc module with streaming capability */
		// Will not use SPAMASSASIN if the process is not available
		fs.readFile(session.path, function(error, raw) {
			if (error) {
				console.log("RAW-FS-ERROR", error);
				// Send an SMTP Error Back
				callback(new Error("FAILED TO STORE EMAIL"));
				
				return fs.unlink(session.path, function(error) {
					console.log("RAW-FS-ERROR->UNLINK-ERROR", error);
				})
			}
			
			var mailparser = new MailParser({
				showAttachmentLinks: true,
			});
			
			mailparser.on("end", function(parsed){
				/* Fix naming issues */
				parsed.envelopeTo = session.envelope.rcptTo;
				// Spamc currently not working
				create(_this, databaseConnection, session, parsed, raw);
				/*
				try {
					Spamc.report(raw, function (error, labResults) {
						if(error) console.log("SMAPC-REPORT-ERROR", error);
						create(_this, databaseConnection, session, parsed, raw, labResults);
					});
				}catch(error) {
					if(error) console.log("SMAPC-NOT-FOUND", error);
					create(_this, databaseConnection, session, parsed, raw);
				}*/
			});
			
			// Pass raw mail to the parser
			mailparser.write(raw);
			mailparser.end();
			
			// Return success to SMTP connection
			callback();
		})
	}

	var server = new SMTPServer({
		size: 20971520, // MAX 20MB Message
		banner: "Galleon MailServer <galleon.email>",
		disabledCommands: ["AUTH"],  // INCOMING SMTP is open to all without AUTH
		logger: false, // Disable Debug logs /* Add option for this in config */
		onData: function(stream, session, callback) {
			console.log("NEW ENVELOPE", JSON.stringify(session.envelope));
			// Create a new connection eID (INC short for incoming)
			session.eID = 'INC' + shortId.generate();
			session.path = undefined;

			_this.environment.modulator.launch(_this.environment.modules['incoming-connection'], session, function(error, _session, _block){
				console.log("CONNECTION MODULES LAUNCHED".green, arguments);
				
				if(_.isObject(_session)) session = _session;
			
				// Ignore email if requested ELSE Process Stream
				if(_block === true) {
					_this.emit('blocked', session);
				}else{
					_this.emit('connection', session);
					/* Add FS EXISTS Check */
					// Set Connection path
					session.path = (_this.environment.paths.raw)
						? path.resolve(_this.environment.paths.raw, session.eID)
						: path.resolve(os.tmpdir(), session.eID)
					// Create new stream
					console.log("SAVING TO", session.path);
					var fileStream = fs.createWriteStream(session.path);
					// Pipe to FS Write Stream
					stream.pipe(fileStream);
					// Let the FileStream consume SMTP Stream
					fileStream.on('finish', function() {
						ProcessMail(session, callback);
					});
				}
			});
		}
	});
	
	server.listen(port);

	_this.emit("ready", server);
};

Incoming.prototype.attach = function(databaseConnection, eID, attachments) {
	if (!attachments) return;
	
	var self = this;
	var populatedAttachments = [];
	async.forEach(attachments || [], function(attachment, callback) {
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
