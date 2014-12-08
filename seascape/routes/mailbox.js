var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	if(req.authenticated == false) return res.status(500).json({ error: "Not Authenticated" });
	
	// Add better error handling here
	req.database.models.mail.find().where({ email: req.authenticated.email }).exec(function(error, mails){
		if(error) res.status(500).json({ error: "Not Authenticated" });
		if((!mails)||(mails.length < 1)) mails = [];
		res.render('mailbox', { mails: mails });
	});
});

module.exports = router;