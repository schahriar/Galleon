var argv = require('yargs').argv;

var express = require('express');
var router = express.Router();

router.use(function(req, res, next) {
	// runs for all HTTP verbs first
	req.getCredentials(function(error, credentials){
		if(error) return res.status(500).json({ error: "Not Authenticated", definition: error });
		req.credentials = credentials;
		next();
	});
})

router.get('/', require("./methods/get.emails.js"));
router.patch('/:eID', require("./methods/patch.email.js"));
router.delete('/:eID', require("./methods/delete.email.js"));
router.get('/:eID/attachment/:id', require("./methods/get.attachment.js"));
router.post('/send', require("./methods/post.email.js"));

module.exports = router;
