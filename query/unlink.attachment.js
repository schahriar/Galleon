var path = require('path');
var fs = require('fs');
var _ = require('lodash');

module.exports = function (Galleon, query, callback) {
  if (!Galleon.connection.collections.queue) return callback(new Error('Collection Not Found!'));
  Galleon.connection.collections.queue.findOne({
    association: query.email,
    eID: query.eID.substring(1)
  }).exec(function (error, mail) {
    if (error) return callback(error);
    if (!mail) return callback("Mail not found!");

    // Make sure mail.attachments is an array
    if (!_.isArray(mail.attachments)) mail.attachments = [];

    if (mail.attachments.length > 0) {
      /* Implement a new method to break out of loop after the first element is found */
      // Remove attachment
      _.remove(mail.attachments, function (attachment) {
        return (attachment.ref === query.ref);
      })
      // Update Draft
      Galleon.connection.collections.queue.update({
        association: query.email,
        eID: query.eID.substring(1)
      }, {
          attachments: mail.attachments
        }).exec(function (error, mail) {
          if (error) return callback(error);
          if (!mail) return callback("Mail not found!");

          // Else
          callback(null);
        })
    } else {
      callback(null);
    }

  })
}
