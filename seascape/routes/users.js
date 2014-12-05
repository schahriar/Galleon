var express = require('express');
var router = express.Router();

var validator = require('validator');
var bcrypt = require('bcryptjs');
var _ = require('lodash');

var pass = true, fail = false;

router.param('email', function(req, res, next, email) {
	req.database.models.users.findOne({email:email}).exec(function(error, user) {
		if((error)||(!user)) req.user = fail;
		else {
			req.user = user;
			req.email = user.email;
			next();
		}
		next();
	});
});

router.route('/:email').get(function(req, res, next) {
	  // Return 500 if the user is not found
	  if(!req.user) return res.status(500).json({ error: 'Ohhh No... We didn\'t catch that email. Perhaps you can try again!', code: '_U'});
	  res.json(req.user);
})

router.route('/create/:email').put(function(req, res, next) {
	// If User exists
	if(req.user) return res.json({ error: 'Ohhh No... An email with that address already exists! Perhaps add some obnoxious number to the end?', code: '.U'});
	
	if((!req.param('email'))||(!req.param('name'))||(!req.param('password'))) return res.json({ error: 'Ohhh No... We didn\'t get enough arguments.', code: '_A'});
	
	var user = {
		email: req.param('email'),
		name: req.param('name'),
		isAdmin: validator.toBoolean(req.param('isAdmin')),
		password: req.param('password')
	}
	
	console.log(email, name, isAdmin);

	// REGEX to match:
	// * Between 4 to 64 characters
	// * Special characters allowed (_)
	// * Alphanumeric
	// * Must start with a letter
	if(!validator.isEmail(user.email))
		return res.status(500).json({ error: "Invalid Email", code: "!U" });

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

	bcrypt.hash(user.password, 10, function(error, hash) {
		if(error) return res.status(500).json({ error: error });
		
		console.log(hash);
		req.database.models.users.create({
			email: user.email,
			name: user.name,
			isAdmin: user.isAdmin,
			password: hash,
		},function(error, user){
			if(error) return res.status(500).json({ error: error });
			// In production this should only return _id
			res.json(user);
			next();
		})
	});
})

module.exports = router;