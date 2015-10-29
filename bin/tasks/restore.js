var colors = require('colors'); // Better looking error handling

module.exports = function(Galleon, argv) {
    var g = new Galleon({ noCheck: true, verbose: false, safemode: true });
    console.warn("WARNING: This process may take a long time...")
    g.on('ready', function(){
        console.log("READY")
        g.query("restore", {}, function(error, failed){
            if(error) {;
                console.error(error);
                process.exit(1);
            }
            console.log("FAILED TO PROCESS", failed.length, "ITEMS");
            console.log("RESTORE WAS SUCCESSFUL");
            process.exit(0);
        });
    })
}
