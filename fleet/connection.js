/// Database
	// Waterline
	var Waterline = require('waterline');
	var Database = require('./bootstrap');
	// ----------------------------------
///
/* -- ------- -- */

module.exports = function(connections, callback){
	Database({
		adapters: {
			'sails-disk': require('sails-disk'),
			'sails-memory': require('sails-memory'),
			'sails-mysql': require('sails-mysql'),
			'sails-mongo': require('sails-mongo'),
			'sails-postgresql': require('sails-postgresql'),
			'sails-redis': require('sails-redis'),
			'sails-sqlserver': require('sails-sqlserver'),
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
