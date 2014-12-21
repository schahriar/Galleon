/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util         = require("util");

// Core
var outbound = require('./outbound');

// Foundations
var schedule = require('node-schedule');
var colors = require('colors'); // Better looking error handling
var moment = require('moment');
var _ = require('lodash');
/* -- ------- -- */

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	success: 'green',
	data: 'grey',
	info: 'cyan',
	warn: 'yellow',
	debug: 'grey',
	bgWhite: 'bgWhite',
	bold: 'bold',
	error: 'red'
});

/* Initiate outbound queue. */
var Queue = function(port, callback){
	console.log("Queue created".success);
	eventEmmiter.call(this);
}

util.inherits(Queue, eventEmmiter);

var queueStart = function (databaseConnection) {
	console.log("Queue started".success);
	
	var maxConcurrent = 10;
	var outbox = databaseConnection.collections.queue;
	
	databaseConnection.collections.queue.count({state:'transit'}).exec(function (error, count){
		if(error) return console.log(colors.error(error));
		console.log(colors.info(count + " mails in transit"));
	  // Bit of a callback hell here
	  if(count <= maxConcurrent){
		  console.log(colors.success("Starting lookup"));
		  outbox.find().where({ or: [{ state: 'pending' }, { state: 'denied' }] }).limit(10).exec(function(error, models){
			  if(error) return console.log(colors.error(error));
			  
			  console.log(colors.info(models.length + " mails found"));
			  _.forEach(models, function(mail) {
					outbox.update({ eID: mail.eID }, { state: 'transit' }).exec(function(error, mail) {
						if(error) console.log(error.error);
						
						var parsedMail = {
							from: mail.from,
							to: mail.to,
							subject: mail.subject,
							text: mail.text,
							html: mail.html
						}
						
						var OUTBOUND = new outbound();
						OUTBOUND.send(parsedMail, function(error, response){
							if(error){
								outbox.update({ eID: mail.eID }, { state: 'denied' }).exec(function(error, mail) {
									if(!error) console.log("Message ".error + mail.subject + " denied".error);
								});
							}else{
								outbox.update({ eID: mail.eID }, { state: 'sent' }).exec(function(error, mail) {
									if(!error) console.log("Message ".success + mail.subject + " sent".success);
								});
							}
						})
					});
			  });
		  });
	  }
	});
}

var queueAdd = function (databaseConnection, mail, options, callback) {
	var _this = this;
	
	// Humane programming
	if((options.constructor !== Object)&&(!callback)) callback = options;
	
	databaseConnection.collections.queue.create({
		sender: mail.from,
		to: mail.to,
		schedule: { attempted: moment().toISOString(), scheduled: moment().toISOString() },
		attempts: 0,
		subject: mail.subject,
		text: mail.text,
		html: mail.html,

		// STRING ENUM: ['pending', 'transit', 'sent', 'denied']
		state: 'pending'
	}, function(error, model){
		if(error) console.log(colors.error(error));
		
		console.log(colors.info(model));
		// Start queue
		queueStart(databaseConnection);
		
		_this.emit('queued', error, model, databaseConnection);
		if(callback) callback(error, model);
	});
};

Queue.prototype.start = queueStart;
Queue.prototype.add = queueAdd;

module.exports = Queue;
