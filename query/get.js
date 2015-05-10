var build = require('./get.build');

module.exports = function(Galleon, query, callback) {
    var folder = build(query.email, query.page)[query.folder.toUpperCase()];
    if (!folder) return callback('Folder not found!');

    Galleon.connection.collections.mail.find()
        .where(folder.where)
        .sort(folder.sort)
        .paginate(folder.paginate)
        .exec(function(error, mails) {
            if (error) return callback("Not Authenticated");

            if ((!mails) || (mails.length < 1)) mails = [];

            // Count total
            Galleon.connection.collections.mail.count().where(folder.where).exec(function(error, found) {
                if (error) return callback("Not Authenticated");

                callback(null,
                    ((folder.filter) && (folder.filter.constructor === Function))
                        ? folder.filter(mails) : mails,
                    {
                        folder: query.folder,
                        page: query.page,
                        total: parseInt(found),
                        limit: parseInt(folder.paginate.limit),
                    })
            })
        })
}
