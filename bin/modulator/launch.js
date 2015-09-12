var _ = require('lodash');
var async = require('async');

module.exports = function() {
    var args = _.toArray(arguments);
    var modules = args.shift(), callback = args.pop();
    var functions = [];
    // Populate functions
    _.each(modules, function(MODULE) {
        functions.push(function(){
            require(MODULE.reference).exec.apply(MODULE, arguments);
        })
    })
    
    // Ignore if no modules are registered for the current task
    if(functions.length <= 0) return callback();
    
    /* Slows down module execution but prevents unintended crashes */
    // Prevents a bad module from corrupting the entire eco-system
    try {
        async.applyEachSeries(functions, args, callback);
    }catch(error){
        callback(error);
    }
}
