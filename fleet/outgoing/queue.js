/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util = require("util");

// Core
var outbound = require('./outbound');

// Foundations
var colors = require('colors'); // Better looking error handling
var moment = require('moment');
var _ = require('lodash');
/* -- ------- -- */

// GLOBALS
var queueUpdate, queueStart, queueAdd;

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
var Queue = function (environment, callback) {
	console.log("Queue created".success);
	this.environment = environment;
	eventEmmiter.call(this);
}

util.inherits(Queue, eventEmmiter);

queueStart = function queueStart(environment, databaseConnection) {
	console.log("Queue started".success);

	var maxConcurrent = 50;
	var outbox = databaseConnection.collections.queue;

	outbox.count({ state: 'transit' }).exec(function (error, count) {
		if (error) return console.log(colors.error(error));
		console.log(colors.info(count + " mails in transit"));
		// Bit of a callback hell here
		if ((count <= maxConcurrent) || (count === undefined)) {
			outbox.find().where({ or: [{ state: 'pending' }, { state: 'denied' }] }).limit(Math.abs(maxConcurrent-count)).exec(function (error, models) {
				if (error) return console.log(colors.error(error));
				
				console.log(colors.info(models.length + " mails found in queue"));
				
				// TIMED FILTER FOR ATTEMPTED EMAILS
				models = _.filter(models, function(mail) {
					/* 
						FILTERS OUT EMAILS BASED ON:
						STATE - WHEN STATE IS NOT DENIED EMAIL IS KEPT
						TIME  - WHEN LAST ATTEMPT IS ( n+1 * 2 minutes ) IN THE PAST EMAIL IS KEPT
						OTHERWISE EMAIL IS REMOVED FROM THE ARRAY
					*/
					if(mail.state !== 'denied') return true;
					if(moment().isAfter(moment(mail.schedule.attempted).add((mail.attempts || 1) * 2, 'minutes'))) {
						return true;
					}else return false;
				});

				_.forEach(models, function (mail) {
					outbox.update({ eID: mail.eID }, { state: 'transit' }).exec(function (error, mail) {
						if (error) console.log(error.error);

						var mail = mail[0]; // Update returns and Array

						var OUTBOUND = new outbound(environment);
						OUTBOUND.send({
							from: mail.sender,
							to: mail.to,
							subject: mail.subject,
							text: mail.text,
							html: mail.html,
							attachments: mail.attachments || []
						}, OUTBOUND_TRACKER(databaseConnection, outbox, mail, maxConcurrent));
					});
				});
			});
		}
	});
}

// OUTBOUND_TRACKER Prevents clogs in the outbound process by implementing a timeout (essentially assuming a sent was failed after 60 seconds)
/// Timeout should be assumed from the max number of concurrent sends (a ratio of 60seconds:10concurrent should be ideal)
var OUTBOUND_TRACKER = function OUTBOUND_TRACKER(databaseConnection, outbox, mail, maxConcurrent) {
	var OUTBOUND_ERROR = function OUTBOUND_ERROR(error) {
		///* SET MAX ATTEMPTS SET TO 5 AFTER QUEUE IS CRONNED
		var MAX_ATTEMPTS = 1;
		if (error) console.log("OUTBOUND_ERROR", error);
		// UPDATE DENIED/FAILED ITEM & INCREMENT ATTEMPTS 
		outbox.update({ eID: mail.eID }, { state: (mail.attempts >= MAX_ATTEMPTS)?'failed':'denied', attempts: ++mail.attempts, schedule: {
			attempted: moment().toISOString(),
			scheduled: mail.scheduled || moment().toISOString()
		} }).exec(function (error, _mail) {
			if (error) console.log("OUTBOUND_ERROR->UPDATE", error);
			else console.log((mail.attempts > MAX_ATTEMPTS)?"OUTBOUND_ERROR->FAILED":"OUTBOUND_ERROR->DENIED", _.first(_mail).eID, _.first(_mail).subject);
		});
		/// - FAILURE NOTICE - ///
		if (mail.attempts >= MAX_ATTEMPTS) {
			console.log("OUTBOUND_ERROR->FAILURE-NOTICE", mail.eID);
			var notice = "The following email has been denied by the receiver.<br>Attempts have been made to deliver this email but have failed in multiple occasions. Please try again.<hr><br> Reason of denial: " + JSON.stringify(error) + "<br> Receiver: " + mail.to + "<br> Subject: " + mail.subject + "<br> Date: " + JSON.stringify(mail.stamp) + "<br><hr><br>" + mail.html;
			databaseConnection.collections.mail.create({
				association: mail.sender,
				sender: mail.sender,
				receiver: mail.to,
				to: mail.to,
				stamp: { sent: (new Date()), received: (new Date()) },
				subject: "Failure Notice: " + mail.subject,
				text: notice,
				html: notice || "Failure Notice",
				
				read: false,
				trash: false,
				
				dkim: "pass",
				spf: "pass",
				
				spam: false,
				spamScore: 0,
				
				// STRING ENUM: ['pending', 'approved', 'denied']
				state: 'approved'
			}, function(error, mail) {
				if (error) console.log("OUTBOUND_ERROR->FAILURE-NOTICE-DENIED", error);
			})
		}
		/// - -------------- - ///
	}
	// ALIAS FOR DEBUGGING
	var OUTBOUND_TIMEDOUT = OUTBOUND_ERROR;
	// TIMEOUT*
	var local_timeout = setTimeout(OUTBOUND_TIMEDOUT, (maxConcurrent) ? Math.round(maxConcurrent * 6000) : 60000);
	/* REQUIRED IMPROVEMENTS */
	return function OUTBOUND_SENT(error, response) {
		clearTimeout(local_timeout);
		if (error) {
			OUTBOUND_ERROR(error);
		} else {
			outbox.update({ eID: mail.eID }, { state: 'sent' }).limit(1).exec(function (error, mail) {
				var mail = _.first(mail);
				// Move from Queue to Mailbox
				databaseConnection.collections.mail.create({
					association: /(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/.exec(mail.sender)[2],
					sender: mail.sender,
					receiver: mail.to,
					to: mail.to,
					stamp: { sent: new Date(), received: new Date() },
					subject: mail.subject,
					text: mail.text,
					html: mail.html,

					read: false,
					trash: false,
					sent: true,

					spam: false,
					spamScore: 0,

					attachments: mail.attachments || [],
	
					// STRING ENUM: ['draft', 'pending', 'approved', 'denied']
					state: 'approved'
				}, function (error, model) {
					if (error) console.log(error);
					if (!error) console.log("Message " + mail.subject + " sent");
				})
			});
		}
	}
}

queueAdd = function queueAdd(databaseConnection, mail, options, callback) {
	var _this = this;

	// Humane programming
	if ((options.constructor !== Object) && (!callback)) callback = options;

	var queue = {
		association: mail.association,
		sender: mail.from,
		to: mail.to,
		schedule: { attempted: moment().toISOString(), scheduled: moment().toISOString() },
		attempts: 0,
		subject: mail.subject,
		text: mail.text || "",
		html: mail.html || "",
		// !IMPORTANT: Attachments should not exists here since it will override previous uploads
		//attachments: mail.attachments || [],

		// STRING ENUM: ['draft', 'pending', 'transit', 'sent', 'denied', 'failed']
		state: (mail.draft) ? 'draft' : 'pending'
	};
	
	// Load queue modules
	_this.environment.modulator.launch(_this.environment.modules['queue'], queue, function (error, _queue) {
		if (_queue !== undefined) queue = _queue;

		queueUpdate = function queueUpdate(error, model) {
			if (error) console.log(colors.error(error));
	
			// Start queue
			queueStart(_this.environment, databaseConnection);

			_this.emit('queued', error, model, databaseConnection);

			if (callback) callback(error, model);
		}
		
		//
		/// This section differentiates between deferred (draft) and immediate email
		if (mail.remove && mail.id) {
			// REMOVES DRAFT
			databaseConnection.collections.queue.destroy({ eID: mail.id, association: queue.association });
		} else if (!!mail.id) {
			// UPDATES DRAFT (if ID is provided)
			databaseConnection.collections.queue.update({ eID: mail.id, association: queue.association }, queue, queueUpdate)
		} else {
			// CREATES DRAFT/PENDING EMAIL
			databaseConnection.collections.queue.create(queue, queueUpdate);
		}
		///
		//
	})
};

Queue.prototype.start = queueStart;
Queue.prototype.add = queueAdd;

module.exports = Queue;
