// Automatically Restores Raw Files to Database based on Database check
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var async = require('async');
var Processor = require('../fleet/incoming/processor');

module.exports = function(Galleon, query, callback) {
    // Make sure raw path is retrievable from environment
    if(!_.has(Galleon.environment, "paths.raw")) return callback(new Error("Raw Path not found."));
    // Resolve Path to raw emails
    var rawPath = path.resolve(Galleon.environment.paths.raw);
    
    var RestoreToDatabase = Processor(Galleon, Galleon.connection, Galleon.Spamc);
    
    // Read List of files
    fs.readdir(rawPath, function(error, files) {
        if(error) return callback(error);
        // Execution Array for Async Parallel
        var ParallelExecutionArray = [];
        _.each(files, function(eID) {
            // Push a check function per file to Exec Array
            ParallelExecutionArray.push(function RESTORE_IF_NO_RECORD(_callback){
                Galleon.connection.collections.mail.findOne({ eID: eID }, function(error, model) {
                    if(error) return _callback(error);
                    // If record not found restore
                    if(!model) {
                        RestoreToDatabase(fs.createReadStream(path.resolve(rawPath, eID)), {
                            eID: eID,
                            path: path.resolve(rawPath, eID),
                            store: false
                        }, _callback);
                    }
                })
            })
        })
        // Launch in parallel
        async.parallel(ParallelExecutionArray, callback);
    })
}