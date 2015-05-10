var _ = require('lodash');
var install = require('../modulator/install');

module.exports = function(Galleon, argv) {
    // Remove install from argv
    argv._.shift();
    _.each(argv._, function(module) {
        install(module);
    })
}
