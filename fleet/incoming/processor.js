// Essential
var MailParser	= require("mailparser").MailParser;
var PassThrough	= require('stream').PassThrough;
var fs			= require('fs');
var path		= require('path');

// Functions
var create = require("./create");

//
/* -------------- Module Human description -------------- */
/*

		Processor creates a function that handles
	processing of a stream and session through parsers
	and spam detectors. The final product is then
	recorded in the database.

		Note that this module is mostly stream based
	and any function placed here that does not involve
	direct database interaction should be entirely
	based on NodeJS streams.

*/

module.exports = function (context, databaseConnection, Spamc) {
	return function INCOMING_EMAIL_PROCESSOR(stream, session, callback) {
		var SpamcPassThrough, fileStream;
		/* Find/Create a Spamc module with streaming capability */
		// Will not use SPAMASSASIN if the process is not available
		var mailparser = new MailParser({
			showAttachmentLinks: true,
		});
		
		mailparser.once("end", function (parsed) {
			/* Fix naming issues */
			// Return an error if we don't know who the envelope is sent to
			if((!session.envelope) && ((!parsed.to) || (!parsed.to[0]) || (!parsed.to[0].address))) {
				return callback({
					responseCode: 451,
					message: "Failed to process Envelope headers"
				});
			}
			parsed.envelopeTo = (session.envelope)?session.envelope.rcptTo:parsed.to;
			
			if(!context.attach) context.attach = require('./attachment');

			create(context, databaseConnection, session, parsed, function (error) {
				// Respond to SMTP Connection (WITH OR WITHOUT ERROR)
				callback(error);

				var reporter = Spamc.report();
				SpamcPassThrough.pipe(reporter);
				// Once report is obtained
				reporter.once('report', function (report) {
					if (!report && context.environment.verbose) return console.error("SPAMC-STREAM-ERROR::NO_REPORT");
					// Update Email from EID
					databaseConnection.collections.mail.update({ eID: session.eID }, {
						isSpam: report.isSpam || false,
						spamScore: report.spamScore || false
					}, function (error, models) {
						if (error || (models.length < 1)) {
							if (context.environment.verbose) console.error("SPAMC-STREAM-ERROR::NO_RECORD");
							return;
						}
					})
				});

				reporter.on('error', function (error) {
					if (context.environment.verbose) console.error("SPAMC-STREAM-ERROR::", error)
				})
			});
		});

		mailparser.once("error", function () {
			if (context.environment.verbose) console.log("PARSER-STREAM-ERROR", arguments)
			callback(new Error("FAILED TO STORE EMAIL"));
		})
	
		// Set Stream Encoding
		stream.setEncoding('utf8');
		SpamcPassThrough = new PassThrough;
		// Create new FS Write stream
		if(session.store) fileStream = fs.createWriteStream(session.path);
		// Pipe to FS Write Stream
		if(session.store) stream.pipe(fileStream);
		// Pipe to MailParser Stream
		stream.pipe(mailparser);
		// Pipe to PassThrough for Spamc-stream
		stream.pipe(SpamcPassThrough);
	}
}