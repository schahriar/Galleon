module.exports = function(Galleon, query, callback) {
    if( query.eID.substring(0, 1) === 'O' )
    Galleon.connection.collections.queue.destroy({ association: { contains: query.email }, eID: query.eID.substring(1) }).exec(callback);
    else
    Galleon.connection.collections.mail.destroy({ association: { contains: query.email }, eID: query.eID.substring(1) }).exec(callback);
}
