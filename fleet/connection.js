/// Database
	// Waterline
	var Waterline = require('waterline');
	var Database = require('./bootstrap');
	// -------------------------------------------
	// Adapters
	var mongodb = require('sails-mongo');
	// ----------------------------------
	// Connection
	var connections = require('../connections');
	// ---------------------------------------------
///
/* -- ------- -- */

module.exports = function(callback){
	Database({
		adapters: {
			'mongodb': mongodb
		},
		collections: {
			mail: require('./models/Mail'),
			users: require('./models/Users')
		},
		connections: connections
	}, function waterlineReady (error, ontology) {
		if (error) throw error;
		// Otherwise return the database connection
		callback(ontology);
	});
}