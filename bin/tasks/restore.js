var colors = require('colors'); // Better looking error handling

module.exports = function(Galleon, argv) {
    var g = new Galleon({ noCheck: true, verbose: false, safemode: true });
    g.on('ready', function(){
        g.query("restore", {}, function(error){
            if(error) {;
                console.error(error);
                process.exit(1);
            }
            console.log("RESTORE WAS SUCCESSFUL");
            process.exit(0);
        });
    })
}
