// Essential
var fs 			 = require('fs');
var path		 = require('path');
// Utilities
var async   = require('async');
var _ 		= require('lodash');
// ID Generation
var crypto = require('crypto');

module.exports = {
	stream: function(_path_, eID, attachment) {
		attachment.id   = eID + "_" 
		+ crypto.createHash('md5')
			.update(attachment.generatedFileName || attachment.fileName)
			.digest('hex');
		attachment.path = path.resolve(_path_, attachment.id);
		
		var output = fs.createWriteStream(attachment.path);
		attachment.stream.pipe(output);
	},
	save: function(_path_, databaseConnection, eID, attachments){
		if (!attachments) return;
		
		var populatedAttachments = [];
		_.each(attachments || [], function(attachment) {
			attachment.id   = eID + "_" 
			+ crypto.createHash('md5')
				.update(attachment.generatedFileName || attachment.fileName)
				.digest('hex');
			attachment.path = path.resolve(_path_, attachment.id);
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
		})
		// Update Database
		databaseConnection.collections.mail.update({ 'eID': eID }, {
			attachments: populatedAttachments
		}, function(error, model){
			/* Have this fall under verbose settings */
			if(error) console.error("EMAIL BOUNCED", error);
		});
	}
}