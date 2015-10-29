// Essential
var fs 			 = require('fs');
var path		 = require('path');
// Utilities
var async   = require('async');
var _ 		= require('lodash');
// ID Generation
var shortId = require('shortid');

module.exports = function(_path_, databaseConnection, eID, attachments) {
	if (!attachments) return;
	
	var populatedAttachments = [];
	async.forEach(attachments || [], function(attachment, callback) {
		attachment.id   = eID + "_" + shortId.generate();
		attachment.path = path.resolve(_path_, attachment.id);

		fs.writeFile(attachment.path, attachment.content, function(err) {
			if(err) return callback(err);
			populatedAttachments.push({
				id: 	  attachment.id,
				cid:	  attachment.contentId,
				fileName: attachment.fileName,
				path: 	  attachment.path,

				transferEncoding: attachment.transferEncoding,
				contentType: attachment.contentType,
				checksum: attachment.checksum,
				length:   attachment.length
			});
			callback();
		});
	}, function(err) {
		if (err) return console.error(err);

		databaseConnection.collections.mail.update({ 'eID': eID }, {
			attachments: populatedAttachments
		}, function(error, model){
			/* Have this fall under verbose settings */
			if(error) console.error("EMAIL BOUNCED", error);
		});
	});
}