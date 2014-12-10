var express = require('express');
var _ = require('lodash');
var router = express.Router();

router.route('/')
	.all(function(req, res, next) {
		// runs for all HTTP verbs first
		req.getCredentials(function(error, credentials){
			if(error) res.status(500).json({ error: "Not Authenticated" });
			else next();
		});
	})
	.get(function(req, res, next) {
		req.database.models.mail.find().where({ receiver: credentials.email, spamScore: { '<=': 5 } /* Spam filter */ }).exec(function(error, mails){
			if(error) res.status(500).json({ error: "Not Authenticated" });
			if((!mails)||(mails.length < 1)) mails = [];
			
			var filteredMails = [];
			_(mails).forEach(function(mail) {
				filteredMails.push(_.pick(mail,['eID','sender','receiver','to','stamp','subject','text','html','read'])); 
			});
			
			res.json(filteredMails);
		});
	})
	.put(function(req, res, next) {
		res.json(req.body);
	})
	.post(function(req, res, next) {
		res.json(req.body);
	})
	.delete(function(req, res, next) {
		res.json(req.body);
	})
	.post(function(req, res) {
		res.json(req.body);
	})

module.exports = router;