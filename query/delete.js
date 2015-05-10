module.exports = function(Galleon, query, callback) {
    Galleon.connection.collections.mail.destroy({ eID: query.eID }).exec(callback);
}
