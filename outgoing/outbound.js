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
Outbound.prototype.send = function (transporter, mail, options, callback) {
	var _this = this;
	
	// Humane programming
	if((options.constructor !== Object)&&(!callback)) callback = options;
	
	// Improve error handling here
	if(!mail) return fail;
	
	// #Revisit Note: Make the logging and error handling a global object
	// 	in a separate directory
	
	if(!options.noStrict){
		
		// Check if From field is a valid email
		// This will increase the chances of your email landing
		// 	in the Inbox rather than Spam, I mean why would you
		//  want your email in Spam? #KeepStrict
		if(mail.to.constructor === Object){
			if(!validator.isEmail(mail.from.address)) return _this.emit("error", { status: "From field is not a valid Email Address!", code:"#Invalid-From-Address" });
		}else if((mail.from.constructor === String)&&(!validator.isEmail(mail.from))) return _this.emit("error", { status: "From field is not a valid Email Address!", code:"#Invalid-From-Address" });
	}
	
	if(!options._unsafeMode){
		if(mail.to.constructor === Object){
			if(!validator.isEmail(mail.to.address)) return _this.emit("error", { status: "To field is not a valid Email Address! This could possibly result your emails to be sent to Neverland.", code:"#Invalid-To-Address" });
			mail.to.name = validator.toString(mail.to.name);
		}
		
		// Convert to string
		mail.subject = validator.toString(mail.subject);
		mail.text = validator.toString(mail.text);
		mail.html = validator.escape(validator.toString(mail.text)); // Not sure if nodemailer does these by default #Revisit
	}
	
	/* Convert plain from to fomatted e.g. 'Name <sender@server.com>' */
	
	// Attach sender's name to email
	if((!!mail.from.name)&&(mail.from.name != "")){
		mail.from.address = validator.toString(mail.from.name + '<' + mail.from.address + '>');
	}
	
	// Attach receiver's name to email
	if((!!mail.to.name)&&(mail.to.name != "")){
		mail.to.address = validator.toString(mail.to.name + '<' + mail.to.address + '>');
	}
	
	/* -------------------------------------------------------------- */
	
    transporter.sendMail({
	  from: mail.from.address,
	  to: mail.to.address,
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
