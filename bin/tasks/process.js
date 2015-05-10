var pm2 = require('pm2');
var colors = require('colors');

var success = function(message) {
    return function(error, PM2Process) {
        if(error) console.error(error);
        else console.log(message.green);
        process.exit(0);
    }
}

var exitError = function() {
    console.log.apply(null, arguments);
    process.exit(0);
}

module.exports = {
    stop: function(Galleon, argv) {
        pm2.connect(function(error) {
            if(error) throw error;
            pm2.stop('galleon-instance' || argv._[1], success("GALLEON HALTED SUCCESSFULLY!"));
        });
    },
    delete: function(Galleon, argv) {
        pm2.connect(function(error) {
            if(error) throw error;
            pm2.delete('galleon-instance' || argv._[1], success("GALLEON DELETED SUCCESSFULLY!"));
        });
    },
    restart: function(Galleon, argv) {
        pm2.connect(function(error) {
            if(error) throw error;
            pm2.restart('galleon-instance' || argv._[1], success("GALLEON RESTARTED SUCCESSFULLY!"));
        });
    },
    startup: function(Galleon, argv) {
        pm2.connect(function(error) {
            if(error) throw error;
            if(!argv._[1]) return exitError("REQUIRES AN OS ARGUMENT".red, "\ngalleon startup <os-name>".magenta)

            pm2.startup(argv._[1], success("STARTUP SCRIPT IS SHOWN BELOW!"));
        });
    }
}
