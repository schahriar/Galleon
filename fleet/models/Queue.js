var crypto = require('crypto');
var shortId = require('shortid');

module.exports = {
	// Idenitity is a unique name for this model
  	identity: 'queue',
	connection: 'storage',

	types: {
		schedule: function(time){
			return time.attempted && time.scheduled
		}
	},

	attributes: {
		eID: {
			type: 'string',
			required: false, // Automatically created
			maxLength: 48,
			unique: true,
		},

		sender: {
			type: 'string',
			required: true,
			index: true,
		},

		to: {
			type: 'json',
			required: true
		},

		schedule: {
		  type: 'json',
		  required: true
		},

		attempts: {
		  type: 'integer',
		  required: true
		},

		subject: {
			type: 'string',
			maxLength: 998, // Refer to rfc5322#section-2.1.1
			required: false
		},

		text: {
			type: 'string',
			required: false
		},

		html: {
			type: 'string',
			required: true // Convert text to HTML if !HTML
		},

		state: {
			type: 'string',
			enum: ['pending', 'transit', 'sent', 'denied'],
			required: true
		}
	},

	beforeCreate: function(attributes, callback) {
		// Should round up about 14 + 2 + 32 = 48 characters at max
		// Hashsum enables content checking using a MD5 checksum
		attributes.eID = shortId.generate() + '&&' + crypto.createHash('md5').update(attributes.html).digest('hex');
		callback();
	}
};
