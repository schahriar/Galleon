var moment = require('moment');
var bcrypt = require('bcryptjs');

exports = module.exports = function(urls){
	return function authenticator(req, res, next){
		
		if(req.path != urls.login){
			/// Basic cookie based authentication
			var cookie = req.signedCookies.authentication;
			if((!cookie)||(cookie == '')){ // :O No cookie!
				return res.redirect(urls.login);
			} else {
				console.log(cookie);
				req.database.models.sessions.findOne({ _id: cookie.sessionID }).exec(function(error, session) {
					if((error)||(!session._id)) req.authenticated = false;
					else req.authenticated = { username: session.username };
				});
			}
			///
		}
		
		req.signIn = function(req, res, callback){
			var opened = moment();
			var expires = opened.add(7, 'days');
			
			req.database.models.users.findOne({ username: req.param('username') }).exec(function(error, user) {
				if(error) return callback(error);
				if(!!user._id) return callback('Username does not match a record');
				
				bcrypt.compare(req.param('password'), user.password, function(error, result) {
					if(error) return callback(error);
					if(result){
						// Create a new session token
						req.database.models.sessions.create({
							username: user.username,
							access: 'approved',
							ipAddress: req.ip,
							stamp: { opened: opened, expires: expires }
						}, function(error, session){
							if(error) return callback(error);

							res.cookie('authentication', { sessionID: session._id, opened: opened }, { signed: true });
							callback(undefined, session);
						});
					}
				});
			})
		},
			
		req.signOut = function(req, res, callback){
			res.clearCookie('authentication');
		}
		
		next();
	}
}