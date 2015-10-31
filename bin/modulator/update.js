var _ = require('lodash');
var environment = require('../environment');

module.exports = function(name, config) {
    var MatchFound = false;
    // Modules are likely required to be loaded on start thus will be loaded Synchronously
    _.each(environment.getModulesSync(), function(MODULE) {
        // If Current Module Matches name
        if((MODULE.name.toLowerCase() === name) || (MODULE.reference.toLowerCase() === name)) {
            // Update Config
            environment.updateModuleConfig(MODULE, config);
            MatchFound = true;
        }
    });
    return MatchFound;
}
