var bcrypt = require('bcryptjs');
var chai = require("chai");
var expect = chai.expect;

describe('User Management Test Suite', function(){
	this.timeout(8000);
	it("should create a user", function(done) {
		global.galleon.createUser({
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
		global.galleon.createUser({
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
	it("should change user's password & hash it correctly", function(done) {
		global.galleon.changePassword("hash@example.com", "changetopass", "okpassword", function(error, user) {
			if(error) throw error;
			expect(user.email).to.equal("hash@example.com");
			expect(bcrypt.compareSync("changetopass", user.password)).to.equal(true);
			done();
		})
	})
	it("should remove a user", function(done) {
		global.galleon.removeUser("hash@example.com", function(error) {
			if(error) throw error;
			done();
		})
	})
	it("should list users", function(done) {
		global.galleon.listUsers(function(error, users) {
			if(error) throw error;
			expect(users).to.have.length(1);
			expect(users[0].email).to.be.equal("info@example.com");
			done();
		})
	})
	it("should deny a short/bad password", function(done) {
		global.galleon.changePassword("info@example.com", "pass", "bestpasswordever", function(error, user) {
			expect(error).to.exist;
			done();
		})
	})
})