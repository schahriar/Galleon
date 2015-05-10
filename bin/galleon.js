var argv = require('yargs').argv;
var Stream = require("stream").Stream;
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

var g = new Galleon({ port: argv.port || argv.p, dock: true });
g.on('ready', function(){
	g.server(function(error, hasStarted){
		if(error) console.log(error.error);
		if(hasStarted) console.log("Server started...".help);
	});
})
