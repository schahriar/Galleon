var colors = require('colors'); // Better looking error handling

module.exports = function(Galleon, argv) {
    var g = new Galleon({ noCheck: true, verbose: false });
    g.on('ready', function(){
        g.createUser({ email: argv._[1], name: argv.name || argv.n, password: argv.password || argv.p }, function(error, user) {
            if(error) {
                console.log("ERROR -> USER NOT REGISTERED".bgRed);
                console.error(error);
                process.exit(1);
            }
            console.log("USER".cyan, argv._[1], "SUCCESSFULLY ADDED!".green);
            process.exit(0);
        });
    })
}
