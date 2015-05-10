var fs = require('fs');
var path = require('path');

module.exports = function(Galleon, query, callback) {
    Galleon.connection.collections.mail.update({
        eID: query.eID,
        association: { contains: query.email }
    }, query.apply).exec(callback);

    // If Spam -> True/False applied
    if ((query.apply.spam) && (query.apply.spam.constructor === Boolean)) {
        // Find Raw Email for training
        fs.readFile(path.resolve(Galleon.environment.paths.raw, query.eID), 'utf8', function(error, buffer) {
            if (error) return console.log(error);
            // Report or Revoke Spam
            try {
                Galleon.spamc[(query.apply.spam)?'tell':'revoke'](buffer, function(error) {
                    if (error) console.log("SMAPC", error);
                    else console.log("REPORTED", query.eID, "AS", (query.apply.spam)?'SPAM':'HAM');
                });
            } catch (error) {
                if (error) console.log("SMAPC-REPORT-ERROR", error);
            }
        });
    }
}
