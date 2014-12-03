var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
	app.models.users.find().exec(function(error, models) {
		if(error) return res.json({ error: error }, 500);
		res.json(models);
	});
	res.send('Users');
});

module.exports = router;