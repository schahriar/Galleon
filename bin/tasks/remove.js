var colors = require('colors'); // Better looking error handling

module.exports = function(Galleon, argv) {
    console.warn("WARNING:".red, "REMOVE COMMAND ONLY REMOVES THE USER & NOT THE EMAILS (FOR NOW)\nYOU CAN REMOVE THE EMAILS MANUALLY.".yellow);
	var g = new Galleon({ noCheck: true, verbose: false });
	g.on('ready', function(){
		g.removeUser({ email: argv.email || argv._[1] }, function(error, user) {
			if(error) throw error;
			console.log("USER".cyan, user[0].email || user, "SUCCESSFULLY REMOVED!".green);
			process.exit(0);
		})
	});
}
