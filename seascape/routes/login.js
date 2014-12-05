var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('login', { title: 'Galleon' });
});

router.get('/out', function(req, res) {
	req.signOut(req, res, function(/* Could use some error handling here */){
		res.redirect('/');
	});
});

router.post('/', function(req,res) {
	req.signIn(req, res, function(error, session){
		if(error) res.status(500).json({ error: error });
		//
		res.json(session);
	});
});

module.exports = router;