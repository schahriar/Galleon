var _ = require('lodash');
var async = require('async');

module.exports = function(modules, context, callback) {
    var functions = [];
    // Populate functions
    _.each(modules, function(MODULE) {
        functions.push(function(){
            require(MODULE.reference).exec.apply(MODULE, arguments);
        })
    })
    async.applyEachSeries(functions, context, callback)
}
