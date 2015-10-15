var chai = require("chai");
var inspect = require("util").inspect;
var Galleon = require('./Galleon');
var G;

describe("Test Suite", function() {
	it("should create a new instance of Galleon", function(done) {
		G = new Galleon({ noCheck: true, verbose: false });
		done();
	})
})