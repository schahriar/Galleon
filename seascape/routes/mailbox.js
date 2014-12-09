var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	req.getCredentials(function(error, credentials){
		if(error) res.status(500).json({ error: "Not Authenticated" });
		
		res.render('mailbox', { email: credentials.email });
	});
});

module.exports = router;