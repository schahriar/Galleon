var chai = require("chai");
var inspect = require("util").inspect;
var crypto = require("crypto");
var bcrypt = require('bcryptjs');
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

var OPTIONS = {
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
}

var expect = chai.expect;

describe("Test Suite", function() {
	this.timeout(10000);
	it("should create a new instance of Galleon", function(done) {
		G = new Galleon(OPTIONS);
		G.on('ready', function(){
			G.server(function(error, hasStarted){
				if(error) throw error;
				if(hasStarted) {
					done();
				}
			});
		})
	})
	// Add bcrypt test
	it("should create a user", function(done) {
		G.createUser({
			email: "info@example.com",
			password: "bestpasswordever",
			name: "test"
		}, function(error, user) {
			if(error) throw error;
			expect(user.email).to.equal("info@example.com");
			expect(user.name).to.equal("test");
			done();
		})
	})
	it("should hash user's password correctly", function(done) {
		G.createUser({
			email: "hash@example.com",
			password: "okpassword",
			name: "hash"
		}, function(error, user) {
			if(error) throw error;
			expect(user.email).to.equal("hash@example.com");
			expect(bcrypt.compareSync("okpassword", user.password)).to.equal(true);
			done();
		})
	})
	describe("SMTP incoming tests", function(){
		it("should receive connections to SMTP server", function(done) {
			connection.connect(function() {
				done();
			})
		})
		it("should receive and process an email to the database", function(done) {
			connection.send({
				from: "test@example.com",
				to: "info@example.com"
			}, "From: me@domain.com\nTo: you@sample.com\nSubject: Example Message\n\rSending a test message.", function(error) {
				if(error) throw error;
				setTimeout(function(){
					G.query('get', {
						email: "info@example.com",
						folder: 'inbox',
						page: 0
					}, function(error, results) {
						if(error) throw error;
						expect(results[0].text).to.equal('Sending a test message.');
						done();
					})
				}, 200)
			})
		})
	})
})