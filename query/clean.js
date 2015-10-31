// Automatically Cleans Stored Files based on Database status
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var async = require('async');
// Connection -> Galleon.connection.collections.mail
module.exports = function(Galleon, query, callback) {
    /* Implement Attachment removal */
    // Make sure raw path is retrievable from environment
    if(!_.has(Galleon.environment, "paths.raw")) return callback(new Error("Raw Path not found."));
    // Resolve Path to raw emails
    var rawPath = path.resolve(Galleon.environment.paths.raw);
    // Read List of files
    fs.readdir(rawPath, function(error, files) {
        if(error) return callback(error);
        // Execution Array for Async Parallel
        var ParallelExecutionArray = [];
        _.each(files, function(eID) {
            // Push a check function per file to Exec Array
            ParallelExecutionArray.push(function UNLINK_IF_NO_RECORD(_callback){
                Galleon.connection.collections.mail.findOne({ eID: eID }, function(error, model) {
                    if(error) return _callback(error);
                    // If record not found Unlink
                    if(!model) {
                        console.log("UNLINKING", path.resolve(rawPath, eID));
                        fs.unlink(path.resolve(rawPath, eID), _callback);
                    }else{
                        _callback();
                    }
                })
            })
        })
        // Launch in parallel
        async.parallel(ParallelExecutionArray, callback);
    })
}