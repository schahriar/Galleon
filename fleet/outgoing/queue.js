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
/* -- ------- -- */

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	success: 'green',
	data: 'grey',
	help: 'cyan',
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
	
	outbox.count({state:'transit'}).exec(function (err, count){
	  // Bit of a callback hell here
	  if(count <= maxConcurrent){
		  outbox.find().where({ or: [{ status: 'pending' }, { status: 'denied' }] }).limit(10).exec(function(err, models){
			  _.forEach(models, function(mail) {
					databaseConnection.collections.outbox.update({ eID: mail.eID }, { state: 'transit' }).exec(function(error, mail) {
						if(error) console.log(error.error);
						
						var OUTBOUND = new outbound();
						OUTBOUND.createTransporter(transporter, function(error, transporter){
							if(error) console.log(error.error);

							OUTBOUND.send(mail, function(error, response){
								if(error){
									databaseConnection.collections.outbox.update({ eID: mail.eID }, { state: 'denied' }).exec(function(error, mail) {
										if(!error) console.log("Message ".error + mail.subject + " denied".error);
									});
								}else{
									databaseConnection.collections.outbox.update({ eID: mail.eID }, { state: 'sent' }).exec(function(error, mail) {
										if(!error) console.log("Message ".success + mail.subject + " sent".success);
									});
								}
							})
						});
					});
			  });
		  });
	  }
	});
}

var queueAdd = function (databaseConnection, mail, options, callback) {
	console.log("Queue added".success);
	var _this = this;
	
	// Humane programming
	if((options.constructor !== Object)&&(!callback)) callback = options;
	
	databaseConnection.collections.queue.create({
		sender: mail.from,
		to: mail.to,
		schedule: { attempted: moment() , scheduled: moment() },
		attemtps: 0,
		subject: mail.subject,
		text: mail.text,
		html: mail.html,

		// STRING ENUM: ['pending', 'transit', 'sent', 'denied']
		state: 'pending'
	}, function(error, model){
		// Start queue
		queueStart(databaseConnection);
		
		_this.emit('queued', error, model, databaseConnection);
		callback(error, model);
	});
};

Queue.prototype.start = queueStart;
Queue.prototype.add = queueAdd;

module.exports = Queue;
