var crypto = require('crypto');
var shortId = require('shortid');

module.exports = {
	// Idenitity is a unique name for this model
  	identity: 'sessions',
	connection: 'authentication',
	
	types: {
		stamp: function(time){
			return time.opened && time.expires
		}
	},
	
	attributes: {
		sessionID: {
			type: 'string',
			required: false, // Automatically created
			maxLength: 48,
			unique: true,
		},
		
		email: {
			type: 'string',
			required: true,
			unique: true // This will disable dual sessions
		},

		access: {
			type: 'string',
			enum: ['approved', 'provoked']
		},
		
		ipAddress: {
			type: 'string',
			required: true
		},
		
		stamp: {
		  type: 'json',
		  stamp: true
		}
	},
	
	beforeCreate: function(attributes, callback) {
		// Should round up about 14 + 2 + 32 = 48 characters at max
		// Hashsum enables email checking without exposing the email
		// to session token.
		attributes.sessionID = shortId.generate() + '__' + crypto.createHash('md5').update(attributes.email).digest('hex');
		callback();
	}
};