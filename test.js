var chai = require("chai");
var inspect = require("util").inspect;
var crypto = require("crypto");
var Galleon = require('./Galleon');
var G;

var CONNECTION = {
	adapter: 'sails-mongo',
	host: 'localhost',
	port: 27017,
	user: 'storage',
	password: 'test',
	database: 'test'
}

describe("Test Suite", function() {
	it("should create a new instance of Galleon", function(done) {
		G = new Galleon({ verbose: false, env: {
			connections: {
				storage: CONNECTION,
				authentication: CONNECTION
			},
			modules: [],
			secret: crypto.randomBytes(20).toString('hex'),
		}});
		done();
	})
})