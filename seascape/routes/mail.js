var express = require('express');
var _ = require('lodash');
var router = express.Router();

router.get('/inbox', function(req, res) {
	req.getCredentials(function(error, credentials){
		if(error) res.status(500).json({ error: "Not Authenticated" });
		// Add better error handling here
		req.database.models.mail.find().where({ receiver: credentials.email, spamScore: { '<=': 5 } /* Spam filter */ }).exec(function(error, mails){
			if(error) res.status(500).json({ error: "Not Authenticated" });
			if((!mails)||(mails.length < 1)) mails = [];
			
			var filteredMails = [];
			_(mails).forEach(function(mail) {
				filteredMails.push(_.pick(mail,['sender','receiver','to','stamp','subject','text','html','read'])); 
			});
			
			res.json({ mails: filteredMails, request: { time: new Date() } });
		});
	});
});

module.exports = router;