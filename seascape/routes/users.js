var express = require('express');
var router = express.Router();

var validator = require('validator');
var bcrypt = require('bcryptjs');
var _ = require('lodash');

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
		var user = {
			username: req.param('username').toString(),
			name: req.param('name').toString(),
			access: {
				isAdmin: validator.toBoolean(req.param('isAdmin').toString()),
				emails: req.param('emails')
			},
			password: req.param('password').toString()
		}
		
		// REGEX to match:
		// * Between 4 to 64 characters
		// * Special characters allowed (_)
		// * Alphanumeric
		// * Must start with a letter
		if(!validator.matches(user.username, /^[a-zA-Z]\w{4,64}$/))
			return res.json({ error: "Invalid Username", code: "!U" }, 500);
	
		// REGEX to match:
		// * Between 2 to 256 characters
		// * Special characters allowed (&)
		// * Alpha
		if((!validator.matches(user.name, /^([ \u00c0-\u01ffa-zA-Z-\&'\-])+$/))&&(validator.isLength(user.name,2,256))
		   return res.json({ error: "Invalid Name", code: "!N" }, 500);
		
		// REGEX to match:
		// * Between 6 to 20 characters
		// * Special characters allowed (@,$,!,%,*,?,&)
		// * Alphanumeric
		if(!validator.matches(user.password, /^(?=.*[a-zA-Z])[A-Za-z\d$@$!%*?&]{6,20}/))
			return res.json({ error: "Invalid Password", code: "!P" }, 500);
	
		if(validator.isLength(user.access.emails,3,1024)){
			// This will not work since Node is async
			// I am just putting it here for future implementations
			/*_.(user.access.emails.split('|')).forEach(function(email){
				if(!validator.isEmail(email)) res.json({ error: "Invalid Email: " + email.toString(), code: "!AR!" }, 500);
			});*/
		}else return res.json({ error: "Invalid Access Rights - Too long", code: "!AR" }, 500);
		
		
		bcrypt.genSalt(10, function(error, salt) {
			bcrypt.hash(user.password, salt, function(error, hash) {
				req.database.models.users.create({
					username: user.username,
					name: user.name,
					access: user.access,
					password: user.hash,
					salt: user.salt,
				},function(error, user){
					if(error) return res.json({ error: error }, 500);
					// In production this should only return _id
					res.json(user);
					next();
				})
			});
		});
	})
	.post(function(req, res, next) {
	  next(new Error('not implemented'));
	})
	.delete(function(req, res, next) {
	  next(new Error('not implemented'));
	})

module.exports = router;