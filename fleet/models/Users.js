module.exports = {
	// Idenitity is a unique name for this model
  	identity: 'users',
	connection: 'authentication',
	
	types: {
		stamp: function(time){
			return time.sent && time.received
		}
	},
	
	attributes: {
		username: {
			type: 'string',
			required: true,
			unique: true
		},

		access: {
			type: 'json',
			required: true,
			index: true
		},
		
		password: {
			type: 'string',
			maxLength: 512,
			required: true
		},
		
		salt: {
			type: 'string',
		  	maxLength: 512,
			required: true
		},
		
		lastLogin: {
			type: 'json',
			required: true
		}
	}
};