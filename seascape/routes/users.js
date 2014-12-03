var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
	// Waterline has a big performance issue when it comes to field exclusion
	// as field exclusion or filtering currently is not implemented into the
	// module.
	req.database.models.users.find().exec(function(error, models) {
		if(error) return res.json({ error: error }, 500);
		res.json(models);
	});
});

router.param('username', function(req, res, next, username) {
	req.database.models.users.findOne({username:username}).exec(function(error, user) {
		if(error) return res.json({ error: error }, 500);
		// Return 404 if the user is not found
		if(!user) res.status(404).send('Sorry, we cannot find <'+username.toString()+'>!');
		req.user = user;
		next();
	});
});

router.route('/:username')
	.get(function(req, res, next) {
	  res.json(req.user);
	})
	.put(function(req, res, next) {
	  // Testing PUT request
	  req.user.type = "PUT";
	  res.json(req.user);
	})
	.post(function(req, res, next) {
	  next(new Error('not implemented'));
	})
	.delete(function(req, res, next) {
	  next(new Error('not implemented'));
	})

module.exports = router;