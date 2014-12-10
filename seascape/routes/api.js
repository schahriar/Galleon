var express = require('express');
var _ = require('lodash');
var router = express.Router();

router.get('/', function(req, res) {
	req.getCredentials(function(error, credentials){
		if(error) res.status(500).json({ error: "Not Authenticated" });
		
		res.json(req.body);
	});
});

module.exports = router;