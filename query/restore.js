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
    
    var RestoreToDatabase = Processor(Galleon, Galleon.connection, Galleon.spamc);
    
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
                    // Match Legacy Raw records
                    var OriginalID = eID;
                    if(eID.substring(0,5) === '_raw_') eID = eID.substring(5);
                    if(!model) {
                        var CALLBACK_CALLED = false;
                        var FileStream = fs.createReadStream(path.resolve(rawPath, OriginalID));
                        // Ignore Stream errors
                        FileStream.on('error', function(error){
                            if(!CALLBACK_CALLED) _callback(null, "ERROR:" + eID + "TIMED_OUT");
                            CALLBACK_CALLED = true;
                        });
                        RestoreToDatabase(FileStream, {
                            eID: eID,
                            path: path.resolve(rawPath, OriginalID),
                            store: false
                        }, function(error) {
                            // Call callback regardless of error
                            if(error) {
                                CALLBACK_CALLED = true;
                                return _callback(null, "ERROR:" + eID + error);
                            }
                            console.log("RESTORED", eID);
                            if(!CALLBACK_CALLED) _callback();
                            CALLBACK_CALLED = true;
                        });
                        // Timeout Function
                        setTimeout(function(){
                            if(!CALLBACK_CALLED) {
                                _callback(null, "ERROR:" + eID + "TIMED_OUT");
                            }
                            CALLBACK_CALLED = true;
                        }, 15000);
                    }else{
                        // EMAIL Exists -> Continue
                        _callback();
                    }
                })
            })
        })
        // Launch in parallel
        async.parallelLimit(ParallelExecutionArray, 5, callback);
    })
}