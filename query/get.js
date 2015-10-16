var build = require('./get.build');

module.exports = function(Galleon, query, callback) {
    var folder = build(query.email, query.page)[query.folder.toUpperCase()];
    if (!folder) return callback('Folder not found!');

    if(!Galleon.connection.collections[folder.collection]) return callback(new Error('Collection Not Found!'));

    function GALLEON_QUERY_GET_EXEC(error, mails) {
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
    }
    if(Galleon.connection.collections[folder.collection].paginate) {
        Galleon.connection.collections[folder.collection]
        .find()
        .where(folder.where)
        .sort(folder.sort)
        .paginate(folder.paginate)
        .exec(GALLEON_QUERY_GET_EXEC)
    }else{
        Galleon.connection.collections[folder.collection]
        .find()
        .where(folder.where)
        .sort(folder.sort)
        .exec(GALLEON_QUERY_GET_EXEC)
    }
}
