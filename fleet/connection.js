/// Database
	// Waterline
	var Waterline = require('waterline');
	var Database = require('./bootstrap');
	// -------------------------------------------
	// Adapters
	var mongodb = require('sails-mongo');
	// ----------------------------------
///
/* -- ------- -- */

module.exports = function(connections, callback){
	Database({
		adapters: {
			'sails-mongo': mongodb
		},
		collections: {
			mail: require('./models/Mail'),
			queue: require('./models/Queue'),

			users: require('./models/Users'),
			sessions: require('./models/Sessions')
		},
		connections: connections
	}, function waterlineReady (error, ontology) {
		callback(error, ontology);
	});
}
