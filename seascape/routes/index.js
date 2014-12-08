var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', { title: 'Galleon' });
	res.set("Connection", "close");
});

module.exports = router;