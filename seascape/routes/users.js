var express = require('express');
var router = express.Router();
var Database = require('../../fleet/connection');

/* GET users listing. */
router.get('/', function(req, res) {
	Database(function(connection){
		res.send('Connected to database');
	});
});

module.exports = router;