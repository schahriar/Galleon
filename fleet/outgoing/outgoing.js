/* -- Modules -- */
// Essential
var eventEmmiter = require('events').EventEmitter;
var util = require("util");

// Foundations

/* -- ------- -- */

//
/* -------------- Module Human description -------------- */
/*

		Outgoing module will take care of outbound mails
	initiated through an inbound connection from mail
	clients or internal programs using the api.
	
		This will not only enable mail clients to
	connect to Galleon and send emails but also will
	enable the ability to build a REST Api where
	necessary.
	
		We use ~mailin~ in this module as well to catch
	messages sent to the specified protocol
	(587 by default or 465 when secured) and will forward
	it to ~outbound~ if autosend is enabled in options.

*/
/* -------------- ------------------------ -------------- */
//

/* * Performance
----------------
NO TESTS YET
----------------
*/


/* Start the Mailin server for Outgoing connections. */
var Outgoing = function (port) {
  eventEmmiter.call(this);

  this.port = port;
}

util.inherits(Outgoing, eventEmmiter);

Outgoing.prototype.listen = function (port) {
  var _this = this;


};

module.exports = Outgoing;