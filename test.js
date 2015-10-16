var chai = require("chai");
var inspect = require("util").inspect;
var crypto = require("crypto");
var SMTPConnection = require('smtp-connection');
var PORT = 8800;
var connection = new SMTPConnection({
	port: PORT,
	ignoreTLS: true
});
var Galleon = require('./Galleon');
var G;

var CONNECTION = {
	adapter: 'sails-memory',
}

describe("Test Suite", function() {
	this.timeout(10000);
	it("should create a new instance of Galleon", function(done) {
		G = new Galleon({
			verbose: false,
			ports: {
				incoming: PORT
			},
			dock: true,
			connections: {
				storage: CONNECTION,
				authentication: CONNECTION
			},
			modules: [],
			secret: crypto.randomBytes(20).toString('hex'),
		});
		G.on('ready', function(){
			G.server(function(error, hasStarted){
				if(error) throw error;
				if(hasStarted) {
					done();
				}
			});
		})
	})
	it("should receive connections to SMTP server", function(done) {
		connection.connect(function() {
			done();
		})
	})
	it("should receive and process an email to the database", function(done) {
		connection.send({
			from: "test@example.com",
			to: "info@example.com"
		}, "From: me@domain.com\n\rTo: you@sample.com\n\rSubject: Example Message\n\rSending a test message.", function(error) {
			if(error) throw error;
			G.query('get', {
				email: "info@example.com",
				folder: 'inbox'
			}, function(error, results) {
				if(error) throw error;
				console.log(results);
				done();
			})
		})
	})
})