/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");

// Foundations
var nodemailer = require('nodemailer');
var validator = require('validator');
/* -- ------- -- */

//
/* -------------- Module Human description -------------- */
/*

		Outbound module will take care of all outbound
	mails initiated through the API.
	
		Emails sent with proper header and DKIM will
	most likely be sent to the inbox but many other
	requirements are there to get around. This has to
	do with the nature of Mail Servers and while many
	advise to use a SMTP provider for outbound mails
	it would not be necessary if strict guidlines are
	followed.
	
		An example of blockage by GMail can be
	represented by a message indicating such and can
	be caught by the callback created using this
	module.
	
		Common best practices for sending emails can
	be found on most major providers such as GMail at
	
	http://support.google.com/mail/bin/answer.py?hl=en&answer=188131
	
	*	Galleon will include a tutorial on how to
	create a legitimate server and will most likely
	include automation tools in the coming versions.
	The goal here is to enable anyone with a static
	IP and some storage to setup a mail server.

*/
/* -------------- ------------------------ -------------- */
//

/* * Performance (Lightweight server - Tier 1 Connection - 0.5GB RAM)
----------------
* Mailforwarding (Gmail to Server to Gmail): 4-6 seconds
* Outbound Mail (Server to Gmail): 2-3 seconds
----------------
*/

/* Initiate an outbound transporter. */
var Outbound = function(port, callback){
	eventEmmiter.call(this);
}

util.inherits(Outbound, eventEmmiter);

Outbound.prototype.createTransporter = function(transporter, callback){
	try {
		if((transporter == null)||(!transporter)) 
		   transporter = nodemailer.createTransport();
		
		callback(undefined, transporter);
	}catch(error){ callback(error) };
}

// Currently only sends to individual emails
// #Revisit - Should add an array option to pass multiple senders and receivers
Outbound.prototype.send = function (mail, options, callback) {
	var _this = this;
	
	// Humane programming
	if((options.constructor !== Object)&&(!callback)) { callback = options; options = {} }
	if(!options.transporter) transporter = nodemailer.createTransport();
		else transporter = options.transporter;
	
	// Improve error handling here
	if(!mail) return fail;
	
	/* -------------------------------------------------------------- */
	
    transporter.sendMail({
	  from: mail.from,
	  to: mail.to,
	  subject: mail.subject,
	  text: mail.text,
	  html: mail.html
	}, function(error, response){
		/* Works both event based and callback based
			since the incoming module would be event
			based & a callback can be more specific 
			in this situation or however it would
			make sense.

			because 2 is better than 1
		*/
		if(!!error){
			// Use only callback to verify sent messages!
			callback(error, response);
			_this.emit('failed', error, response);
		}else{
			callback(error, response);
			_this.emit('sent', response);
		}
	}); 
};

module.exports = Outbound;
