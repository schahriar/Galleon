var bcrypt = require('bcryptjs');
var chai = require("chai");
var expect = chai.expect;
var request = require('request');

var CookieJar = request.jar();
var request = request.defaults({ jar: CookieJar });

describe('API Test Suite', function () {
	this.timeout(8000);
	it("should connect to API", function (done) {
		request.post({
			url: 'http://localhost:3080/access/login/',
			form: {
				email: "info@example.com",
				password: "bestpasswordever"
			},
			jar: true
		}, function (err, httpResponse, body) {
			if (err) throw err;
			expect(JSON.parse(body).success).to.equal(true);
			done()
		});
	})
	it("should remain connected with a cookie", function (done) {
		request.get({
			url: "http://localhost:3080/access/check",
			jar: true
		}, function (err, httpResponse, body) {
			if (err) throw err;
			expect(JSON.parse(body).authenticated).to.not.equal(false);
			expect(JSON.parse(body).authenticated.email).to.equal("info@example.com");
			done()
		})
	})
	it("should change password correctly", function(done) {
		request.post({
			url: 'http://localhost:3080/access/changepassword/',
			form: {
				email: "info@example.com",
				cpassword: "bestpasswordever",
				password: "newpassword"
			},
			jar: true
		}, function (err, httpResponse, body) {
			if (err) throw err;
			expect(JSON.parse(body).success).to.equal(true);
			done()
		});
	})
	it("should login with the new password", function (done) {
		request.post({
			url: 'http://localhost:3080/access/login',
			form: {
				email: "info@example.com",
				password: "newpassword"
			},
			jar: true
		}, function (err, httpResponse, body) {
			if (err) throw err;
			expect(JSON.parse(body).success).to.equal(true);
			done()
		});
	})
	it("should logout correctly", function(done) {
		request.post({
			url: "http://localhost:3080/access/logout",
			jar: true
		}, function (err, httpResponse, body) {
			if (err) throw err;
			expect(JSON.parse(body).success).to.equal(true);
			// Double check
			request.get({
				url: "http://localhost:3080/access/check",
				jar: true
			}, function (err, httpResponse, body) {
				if (err) throw err;
				expect(JSON.parse(body).authenticated).to.equal(false);
				done()
			})
		})
	})
	it("should deny invalid password", function(done) {
		request.post({
			url: 'http://localhost:3080/access/login',
			form: {
				email: "info@example.com",
				password: "bestpasswordever"
			},
			jar: true
		}, function (err, httpResponse, body) {
			if (err) throw err;
			expect(JSON.parse(body).success).to.not.equal(true);
			done()
		});
	})
})