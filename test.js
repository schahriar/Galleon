require('blanket')({
	pattern: __dirname
});
var chai = require("chai");
var inspect = require("util").inspect;
var crypto = require("crypto");
var SMTPConnection = require('smtp-connection');
var fs = require('fs');
var path = require('path');
var PORT = 8800;

// Actual Tests are located in the `tests` folder

global.Galleon = require('./Galleon');
global.galleon;
global.connection = new SMTPConnection({
	port: PORT,
	ignoreTLS: true
});
global.options = {
	verbose: false,
	ports: {
		incoming: PORT,
		server: 3080
	},
	dock: true,
	connections: {
		storage: { adapter: 'sails-memory' },
		authentication: { adapter: 'sails-memory' }
	},
	modules: [],
	secret: crypto.randomBytes(20).toString('hex'),
}

var expect = chai.expect;

fs.readdirSync('./tests').forEach(function(file) {
	// Require a test if available
	if(path.extname(file) === '.js') {
		require(path.resolve('./tests', file));
	}
});