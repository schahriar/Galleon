var _ = require('lodash');
var Modulator = require('../modulator');

module.exports = function(Galleon, argv) {
    var modulator = new Modulator();
    // Remove install from argv
    argv._.shift();
    _.each(argv._, function(Module) {
        modulator.install(Module);
    })
}
