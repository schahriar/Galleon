var path = require('path');
var fs = require('fs');
var _ = require('lodash');

module.exports = function(Galleon, query, callback) {
    if(!Galleon.connection.collections.mail) return callback(new Error('Collection Not Found!'));
    Galleon.connection.collections.mail.findOne({
        association: query.email,
        eID: query.eID.substring(1)
    }).exec(function(error, mail) {
        if (error) return callback(error);
        if (!mail) return callback("Mail not found!");
        
        // Determines if attachment is CID based (embedded)
        var attachment = _.findWhere(mail.attachments, (query.id.substring(0, 4) !== "cid=") ? {
            id: query.eID.substring(1) + "_" + query.id
        } : {
            cid: query.id.slice(4)
        });

        if (attachment) {
            fs.exists(path.resolve(Galleon.environment.paths.attachments, _.result(attachment, 'id')), function(exists) {
                /* Escape filename */
                if (exists) {
                    callback(null, {
                        path: path.resolve(Galleon.environment.paths.attachments, _.result(attachment, 'id')),
                        name: _.result(attachment, 'fileName'),
                        length: _.result(attachment, 'length') || 0,
                        cid: (query.id.substring(0, 4) === "cid="),
                    })
                } else callback('Attachment file not found!');
            });
        } else {
            callback('Attachment not found!');
        }
    })
}
