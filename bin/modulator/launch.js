var _ = require('lodash');
var async = require('async');

module.exports = function() {
    var args = _.toArray(arguments);
    var modules = args.shift(), callback = args.pop();
    var functions = [];
    // Populate functions
    _.each(modules, function(MODULE) {
        functions.push(function(callback){
            /* Slows down module execution but prevents unintended crashes */
            // Prevents a bad module from corrupting the entire eco-system
            try {
                require(MODULE.reference).exec.apply(MODULE, arguments);
            }catch(error){
                callback(error);
            }
        })
    })
    
    // Ignore if no modules are registered for the current task
    if(functions.length <= 0) return callback();
    
    async.series(functions, callback);
}
