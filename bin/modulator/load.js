var _ = require('lodash');
var environment = require('../environment');

module.exports = function(modules) {
    var container = new Object;
    // Modules are likely required to be loaded on start thus will be loaded Synchronously
    _.each(modules || environment.getModulesSync(), function(MODULE) {
        // Fill container according to 'extends' attribute

        // Assign array if key is undefined
        if(!container[MODULE.extends]) container[MODULE.extends] = [];
        // Push current Module to the respective key
        container[MODULE.extends].push(MODULE);
    });
    return container;
}
