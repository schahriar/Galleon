require('blanket')({
    pattern: function (filename) {
        return !/node_modules/.test(filename);
    }
});
var chai = require("chai");
var expect = chai.expect;
var http = require('http');

describe('Initial Test Suite', function(){
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
	it("should connect to API server", function(done) {
		http.get('http://localhost:3080', function (res) {
			// Not Authenticated (403)
			expect(res.statusCode).to.equal(403);
			done();
		});
	})
})