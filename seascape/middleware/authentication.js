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
				//
				/// Do a ton of cool security stuff here
				//
				req.database.models.sessions.findOne({ sessionID: cookie.sessionID }).exec(function(error, session) {
					if((error)||(!session)) {
						req.authenticated = false;
					}
					else req.authenticated = { email: session.email };
				});
			}
			///
		}
		
		req.signIn = function(req, res, callback){
			var opened = moment();
			var expires = opened.add(7, 'days');
			
			req.database.models.users.findOne({ email: req.param('email') }).exec(function(error, user) {
				if(error) return callback(error);
				if(!user) return callback('User not found.');
				if(!user.id) return callback('Email does not match a record');
				
				bcrypt.compare(req.param('password'), user.password, function(error, result) {
					if(error) return callback(error);
					if(result){
						req.database.models.sessions.destroy({ email: req.param('email') }, function(error){
							// Log any errors here
							if(error) console.log(error);
							// Create a new session token
							req.database.models.sessions.create({
								email: user.email,
								access: 'approved',
								ipAddress: req.ip,
								stamp: { opened: opened.toISOString() , expires: expires.toISOString() }
							}, function(error, session){
								if(error) return callback(error);

								res.cookie('authentication', { sessionID: session.sessionID, opened: opened }, { signed: true });
								return callback(undefined, session);
							});
						})
					}
				});
			})
		},
			
		req.signOut = function(req, res, callback){
			req.database.models.sessions.destroy({ sessionID: req.signedCookies.authentication.sessionID}, function(error){
				// Should do better logging here
				// An invalid sessionID would either
				//   mean a broken secret key or
				//   possibly an error in the token
				//	 system.
				if(error) console.log(error);
				res.clearCookie('authentication');
				return callback(undefined);
			});
		}
		
		next();
	}
}