var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('login', { title: 'Galleon' });
});

router.post('/', function(req,res) {
	req.signIn(req, res, function(error, session){
		if(error) res.status(500).json({ error: error });
		//
		res.json(session);
	});
});

module.exports = router;