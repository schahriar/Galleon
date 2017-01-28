module.exports = function (Galleon, query, callback) {
  if (!Galleon.connection.collections.queue) return callback(new Error('Collection Not Found!'));
  if (!Galleon.connection.collections.mail) return callback(new Error('Collection Not Found!'));
  if (query.eID.substring(0, 1) === 'O')
    Galleon.connection.collections.queue.destroy({ association: query.email, eID: query.eID.substring(1) }).exec(callback);
  else
    Galleon.connection.collections.mail.destroy({ association: query.email, eID: query.eID.substring(1) }).exec(callback);
}
