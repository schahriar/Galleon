module.exports = {
	// Modify each connection to your Database's
	// access information.
	storage: {
		adapter: 'mongodb',
		host: 'localhost',
		port: 27017, // Default port for MongoDB
		user: 'storage',
		password: 'storage_control',
		database: 'storage'
	},
	authentication: {
		adapter: 'mongodb',
		host: 'localhost',
		port: 27017, // Default port for MongoDB
		user: 'user',
		password: 'user_control',
		database: 'users'
	},
		
}