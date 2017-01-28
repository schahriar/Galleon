var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var crypto = require('crypto');

module.exports = function (Galleon, query, callback) {
  if (!Galleon.connection.collections.queue) return callback(new Error('Collection Not Found!'));
  Galleon.connection.collections.queue.findOne({
    association: query.email,
    eID: query.eID.substring(1)
  }).exec(function (error, mail) {
    if (error) return callback(error);
    if (!mail) return callback("Mail not found!");
    if (!query.file) return callback("No file received");

    // Make sure mail.attachments is an array
    if (!_.isArray(mail.attachments)) mail.attachments = [];

    var reference = crypto.randomBytes(8).toString('hex');

    mail.attachments.push({
      id: (query.file.filename) ? (query.file.filename.split("_")[1] || null) : null,
      cid: null, /* Not implemented yet */
      fileName: query.file.originalname,
      path: query.file.path,

      transferEncoding: query.file.encoding,
      contentType: query.file.mimetype,
      checksum: null, /* Not implemented yet */
      length: query.file.size,

      ref: reference
    })
    Galleon.connection.collections.queue.update({
      association: query.email,
      eID: query.eID.substring(1)
    }, {
        attachments: mail.attachments
      }).exec(function (error, mail) {
        if (error) return callback(error);
        if (!mail) return callback("Mail not found!");

        // Else
        callback(null, { ref: reference });
      })
  })
}
