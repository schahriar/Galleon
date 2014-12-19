var nopt = require("nopt");
var Stream = require("stream").Stream;
var path = require("path");
var colors = require('colors'); // Better looking error handling

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	success: 'green',
	data: 'grey',
	help: 'cyan',
	warn: 'yellow',
	debug: 'grey',
	bgWhite: 'bgWhite',
	bold: 'bold',
	error: 'red'
});

var Galleon = require("../Galleon");

var options = { "port" : [Number]
	, "attachments" : path
	, "mode" : [ "development", "production", "private" ]
	, "server" : Boolean
}
var short = { "p" : ["--port"]
	, "a" : ["--attachments"]
	, "m" : ["--mode"]
	, "s" : ["--server"]
}

var parsed = nopt(options, short, process.argv, 2);

Galleon.server({ port: parsed.port }, function(error, hasStarted){
	if(error) console.log(error.error);
	if(hasStarted) console.log("Server started...".help);
});