/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");
var fs 			 = require('fs');
var path		 = require('path');
var os			 = require('os');

// SMTP Mail Handling
var SMTPServer = require('smtp-server').SMTPServer;
var Processor = require('./processor');
var Attachment = require('./attachment');

// Utilities
var async   = require('async');
var _ 		= require('lodash');

// ID Generation
var crypto = require('crypto');
var shortId = require('shortid');

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
	
	var ProcessMail = Processor(this, databaseConnection, Spamc);

	var server = new SMTPServer({
		size: 20971520, // MAX 20MB Message
		banner: "Galleon MailServer <galleon.email>",
		disabledCommands: ["AUTH"],  // INCOMING SMTP is open to all without AUTH
		logger: false, // Disable Debug logs /* Add option for this in config */
		onData: function(stream, session, callback) {
			// Create a new connection eID
			session.eID = shortId.generate() + '&&' + crypto.createHash('md5').update(session.id || "NONE").digest('hex');
			session.path = undefined;

			_this.environment.modulator.launch(_this.environment.modules['incoming-connection'], session, function(error, _session, _block){
				if(_this.environment.verbose) console.log("CONNECTION MODULES LAUNCHED".green, arguments);
				
				if(_.isObject(_session)) session = _session;
			
				// Ignore email if requested by 'incoming-connection' modules
				// Otherwise Process Stream
				if(_block === true) {
					_this.emit('blocked', session);
					callback({ responseCode: 451, message: "Request Blocked"});
				}else{
					_this.emit('connection', session);
					/* Add FS EXISTS Check */
					// Tell Processor to Store RAW if env path is set
					session.store = _.has(_this.environment, 'paths.raw');
					// Set Connection path
					session.path = (_.has(_this.environment, 'paths.raw'))
						? path.resolve(_this.environment.paths.raw, session.eID)
						: path.resolve(os.tmpdir(), session.eID);
					ProcessMail(stream, session, callback);
				}
			});
		}
	});
	
	server.listen(port);

	_this.emit("ready", server);
};

Incoming.prototype.attach = function(databaseConnection, eID, attachments){
	if((!this.environment.paths) || (!this.environment.paths.attachments)) return;
	
	Attachment.save(this.environment.paths.attachments, databaseConnection, eID, attachments);
}

module.exports = Incoming;
