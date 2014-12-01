module.exports = {
	security: {
	  'default': 'mongo',

	  mongo: {
		module: 'mongodb',
		host: 'localhost',
		port: 27017,
		user: 'security',
		password: 'security_control',
		database: 'security'
	  }

	},

	storage: {
	  'default': 'mongo',

	  mongo: {
		module: 'mongodb',
		host: 'localhost',
		port: 27017,
		user: 'storage',
		password: 'storage_control',
		database: 'storage'
	  }

	},

	queue: {
	  'default': 'mongo',

	  mongo: {
		module: 'mongodb',
		host: 'localhost',
		port: 27017,
		user: 'queue',
		password: 'queue_control',
		database: 'queue'
	  }

	}
}