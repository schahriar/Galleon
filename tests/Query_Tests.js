var bcrypt = require('bcryptjs');
var chai = require("chai");
var expect = chai.expect;

describe('Query Test Suite', function(){
	this.timeout(8000);
	it("should create a new instance of Galleon", function(done) {
		global.galleon = new global.Galleon(global.options);
		global.galleon.on('ready', function(){
			global.galleon.server(function(error, hasStarted){
				if(error) throw error;
				if(hasStarted) {
					done();
				}
			});
		})
	})
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
})