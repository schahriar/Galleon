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
		  stamp: true
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
			notEmpty: true,
			required: true // Convert text to HTML if !HTML
		},
		
		// Indicates if an email has been read
		read: {
			type: 'boolean',
			required: true
		},
		
		// Indicates if an email is spam
		isSpam: {
			type: 'boolean',
			required: true
		},
		
		// Ranges from 0 to 100
		spamScore: {
			type: 'integer',
			required: true
		},
		
		state: {
			type: 'string',
			enum: ['pending', 'approved', 'denied']
		}
	}
};