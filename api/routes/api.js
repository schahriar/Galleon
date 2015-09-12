var argv = require('yargs').argv;

var express = require('express');
var router = express.Router();
// Multipart-Upload
var multer = require('multer');
// Attachment ID
var shortId = require('shortid');

// Multipart parser for attachment uploads
var storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, req.environment.paths.attachments || "\tmp")
	},
	filename: function (req, file, callback) {
		/* SECURITY -> Email ID Must be validated */
		callback(null, "+" + req.param("eID") + "_" + shortId.generate())
	}
})

var upload = multer({ storage: storage, limits: {
	fields: 20,
	fileSize: 15000000,
	files: 20,
	parts: 20000,
}})

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
router.post('/send/:eID/attachment', upload.single('attachment'), require("./methods/post.attachment.js"));
router.delete('/send/:eID/attachment/:ref', require("./methods/delete.attachment.js"));

module.exports = router;
