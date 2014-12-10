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
		res.json(req.body);
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