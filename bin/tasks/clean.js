var colors = require('colors'); // Better looking error handling

module.exports = function(Galleon, argv) {
    var g = new Galleon({ noCheck: true, verbose: false });
    g.on('ready', function(){
        g.query("clean", {}, function(error){
            if(error) {;
                console.error(error);
                process.exit(1);
            }
            console.log("CLEAN WAS SUCCESSFUL");
            process.exit(0);
        });
    })
}
