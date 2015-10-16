var fs = require('fs');
var path = require('path');

module.exports = function(Galleon, query, callback) {
    if(!Galleon.connection.collections.mail) return callback(new Error('Collection Not Found!'));
    Galleon.connection.collections.mail.update({
        eID: query.eID.substring(1),
        association: { contains: query.email }
    }, query.apply).exec(callback);

    // If Spam -> True/False applied
    if ((query.apply.spam) && (query.apply.spam.constructor === Boolean)) {
        // Find Raw Email for training
        fs.readFile(path.resolve(Galleon.environment.paths.raw, query.eID.substring(1)), 'utf8', function(error, buffer) {
            if (error) return console.log("SMAPC_RAW->ERROR", error);
            // Report or Revoke Spam
            try {
                Galleon.spamc[(query.apply.spam)?'tell':'revoke'](buffer, function(error) {
                    throw error;
                    console.log("SMAPC_REPORT->REPORTED", query.eID.substring(1), "AS", (query.apply.spam)?'SPAM':'HAM');
                });
            } catch (error) {
                if (error) console.log("SMAPC_REPORT->ERROR", error);
            }
        });
    }
}
