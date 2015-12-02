var _ = require('lodash');
var Modulator = require('../modulator');

module.exports = function(Galleon, argv) {
    // Format -> galleon config <module_name> <config_name> <config_value>
    
    // Remove config from argv
    argv._.shift();
    var Config = {};
    try {
        Config[argv._[1]] = argv._[2];
    }catch(e) {
        throw new Error("Failed to update Config. Try the following format \n galleon config <module_name> <config_name> <config_value>");
    }
    var SUCCESS = Modulator.update(argv._[0], Config);
    if(SUCCESS) {
        console.log("UPDATED SUCCESSFULLY");
    }else{
        console.log("MODULE NOT FOUND");
    }
}
