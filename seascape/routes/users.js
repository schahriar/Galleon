var express = require('express');
var router = express.Router();

var validator = require('validator');
var bcrypt = require('bcryptjs');
var _ = require('lodash');

var pass = true, fail = false;

/* GET users listing. */
router.get('/', function(req, res) {
	// Waterline has a big performance issue when it comes to field exclusion
	// as field exclusion or filtering currently is not implemented into the
	// module.
	req.database.models.users.find().exec(function(error, models) {
		if(error) return res.status(500).json({ error: error });
		res.json(models);
	});
});

router.param('user', function(req, res, next, username) {
	req.database.models.users.findOne({username:username}).exec(function(error, user) {
		if(error) req.user = fail;
		else {
			req.user = user;
			req.username = username;
			next();
		}
	});
});

router.route('/:user').get(function(req, res, next) {
	  // Return 404 if the user is not found
	  if(!req.user) return res.status(404).send('Ohhh No... We didn\'t catch that username. Perhaps you can try again!');
	  res.json(req.user);
})

router.route('/create/:user').put(function(req, res, next) {
	// If User exists
	if(req.user) return res.send('Ohhh No... A user with that username already exists! Perhaps add some obnoxious number to the end?');
	
	var user = {
		username: req.username,
		name: req.param('name'),
		access: {
			isAdmin: validator.toBoolean(req.param('isAdmin')),
			emails: req.param('emails')
		},
		password: req.param('password')
	}

	// REGEX to match:
	// * Between 4 to 64 characters
	// * Special characters allowed (_)
	// * Alphanumeric
	// * Must start with a letter
	if(!validator.matches(user.username, /^[a-zA-Z]\w{4,64}$/))
		return res.status(500).json({ error: "Invalid Username", code: "!U" });

	// REGEX to match:
	// * Between 2 to 256 characters
	// * Special characters allowed (&)
	// * Alpha
	if((!validator.matches(user.name, /^([ \u00c0-\u01ffa-zA-Z-\&'\-])+$/))&&(validator.isLength(user.name,2,256)))
	   return res.status(500).json({ error: "Invalid Name", code: "!N" });

	// REGEX to match:
	// * Between 6 to 20 characters
	// * Special characters allowed (@,$,!,%,*,?,&)
	// * Alphanumeric
	if(!validator.matches(user.password, /^(?=.*[a-zA-Z])[A-Za-z\d$@$!%*?&]{6,20}/))
		return res.status(500).json({ error: "Invalid Password", code: "!P" });

	if(validator.isLength(user.access.emails,3,1024)){
		// This will not work since Node is async
		// I am just putting it here for future implementations
		/*_.(user.access.emails.split('|')).forEach(function(email){
			if(!validator.isEmail(email)) res.status(500).json({ error: "Invalid Email: " + email, code: "!AR!" }, 500);
		});*/
	}else return res.status(500).json({ error: "Invalid Access Rights - Too long", code: "!AR" });


	bcrypt.genSalt(10, function(error, salt) {
		if(error) return res.status(500).json({ error: error });

		bcrypt.hash(user.password, salt, function(error, hash) {
			if(error) return res.status(500).json({ error: error });

			req.database.models.users.create({
				username: user.username,
				name: user.name,
				access: user.access,
				password: hash,
				salt: salt,
			},function(error, user){
				if(error) return res.status(500).json({ error: error });
				// In production this should only return _id
				res.json(user);
				next();
			})
		});
	});
})

module.exports = router;