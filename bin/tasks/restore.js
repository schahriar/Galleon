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
            var i;
            var errors = [];
            for(i=0; i<failed.length; i++) {
                if(failed[i] !== undefined) error.push(failed[i]);
            }
            if(errors.length >= 1) console.log("FAILED TO PROCESS", errors.length, "ITEMS");
            console.log("RESTORE WAS SUCCESSFUL");
            process.exit(0);
        });
    })
}
