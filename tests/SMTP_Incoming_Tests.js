var chai = require("chai");
var expect = chai.expect;

describe("SMTP Incoming Tests", function () {
	it("should receive connections to SMTP server", function (done) {
		global.connection.connect(function () {
			done();
		})
	})
	it("should receive and process an email to the database", function (done) {
		global.connection.send({
			from: "test@example.com",
			to: "info@example.com"
		}, "From: me@domain.com\nTo: you@sample.com\nSubject: Example Message\n\rSending a test message.", function (error) {
			if (error) throw error;
			setTimeout(function () {
				global.galleon.query('get', {
					email: "info@example.com",
					folder: 'inbox',
					page: 0
				}, function (error, results) {
					if (error) throw error;
					expect(results[0].text).to.equal('Sending a test message.');
					done();
				})
			}, 200)
		})
	})
})