var crypto = require('crypto');
var shortId = require('shortid');

module.exports = {
	// Idenitity is a unique name for this model
  	identity: 'mail',
	connection: 'storage',

	types: {
		stamp: function(time){
			return time.sent && time.received
		}
	},

	attributes: {
		eID: {
			type: 'string',
			required: false, // Automatically created
			maxLength: 48,
			unique: true,
		},

        // Should handle multiple associations
        // in beta:
        // http://stackoverflow.com/questions/24166253/waterline-find-array-in-array
        /* FORMAT
            .find({association: { contains: ["owner1","owner2", ...]}})
        */
        // This would allow email sharing within organization and group associations
        association: {
			type: 'array',
			required: true,
			index: true,
		},

		sender: {
			type: 'string',
			required: true,
			index: true,
		},

		receiver: {
			type: 'string',
			required: true,
			index: true
		},

		to: {
			type: 'json',
			required: false
		},

		stamp: {
		  type: 'json',
		  json: true
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

		// Indicates if an email has been read
		read: {
			type: 'boolean',
			required: true
		},

        // Indicates if an email has been trashed
        trash: {
            type: 'boolean',
            required: true
        },

		// Indicates if an email is spam
		spam: {
			type: 'boolean',
			required: true
		},

        // Indicates if an email is an outbox sent
		sent: {
			type: 'boolean',
			required: true,
            defaultsTo : false
		},

        // DKIM Test
		dkim: {
			type: 'boolean',
			required: true,
            defaultsTo : false
		},

        // spf Test
		spf: {
			type: 'boolean',
			required: true,
            defaultsTo : false
		},

		// Ranges from 0 to 100
		spamScore: {
			type: 'integer',
			required: true
		},

        attachments: {
            type: 'array'
        },

		state: {
			type: 'string',
			enum: ['draft', 'pending', 'approved', 'denied', 'trashed']
		}
	},

	beforeCreate: function(attributes, callback) {
		// Should round up about 14 + 2 + 32 = 48 characters at max
		// Hashsum enables content checking using a MD5 checksum
		attributes.eID = (attributes.eID)?attributes.eID:shortId.generate() + '&&' + crypto.createHash('md5').update(attributes.html).digest('hex');
		callback();
	}
};
