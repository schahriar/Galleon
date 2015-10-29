var _ = require('lodash');
var colors = require('colors'); // Better looking error handling

module.exports = function(Galleon, argv) {
    var g = new Galleon({ noCheck: true, verbose: false, safemode: true });
	g.on('ready', function(){
		g.listUsers({ limit: argv.limit || 20 }, function(error, users) {
			/* USE ASYNC HERE LATER */
			_.each(users, function(user, count) {
				console.log((count+1 + ":").red, user.email.magenta, '\t', user.name.blue);
			})
			process.exit(0);
		})
	});
}
