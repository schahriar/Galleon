var colors = require('colors'); // Better looking error handling

module.exports = function(Galleon, argv) {
    var g = new Galleon({ noCheck: true, verbose: false, safemode: true });
    g.on('ready', function(){
        g.changePassword({ email: argv._[1] }, argv.password || argv.p, null, function(error, user) {
            if(error) {
                console.log("ERROR -> PASSWORD NOT CHANGED".bgRed);
                console.error(error);
                process.exit(1);
            }
            console.log("USER".cyan, argv._[1], "SUCCESSFULLY CHANGED!".green);
            process.exit(0);
        }, true);
    })
}
