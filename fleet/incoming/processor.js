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

		mailparser.on("end", function (parsed) {
			/* Fix naming issues */
			parsed.envelopeTo = session.envelope.rcptTo;
			create(context, databaseConnection, session, parsed, function (error) {
				// Respond to SMTP Connection (WITH OR WITHOUT ERROR)
				callback(error);

				var reporter = Spamc.report();
				SpamcPassThrough.pipe(reporter);
				// Once report is obtained
				reporter.once('report', function (report) {
					if (!report) return console.error("SPAMC-STREAM-ERROR::NO_REPORT");
					// Update Email from EID
					databaseConnection.collections.mail.update({ eID: session.eID }, {
						isSpam: report.isSpam || false,
						spamScore: report.spamScore || false
					}, function (error, models) {
						if (error || (models.length < 1)) {
							return console.error("SPAMC-STREAM-ERROR::NO_RECORD")
						}
					})
				});

				reporter.on('error', function (error) {
					console.error("SPAMC-STREAM-ERROR::", error)
				})
			});
		});

		mailparser.on("error", function () {
			if (context.environment.verbose) console.log("PARSER-STREAM-ERROR", arguments)
			callback(new Error("FAILED TO STORE EMAIL"));
		})
	
		// Set Stream Encoding
		stream.setEncoding('utf8');
		SpamcPassThrough = new PassThrough;
		// Create new FS Write stream
		fileStream = fs.createWriteStream(session.path);
		// Pipe to FS Write Stream
		stream.pipe(fileStream);
		// Pipe to MailParser Stream
		stream.pipe(mailparser);
		// Pipe to PassThrough for Spamc-stream
		stream.pipe(SpamcPassThrough);
	}
}