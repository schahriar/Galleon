var _ = require('lodash');

module.exports = function(req, res) {
	var email = {
		from: req.credentials.name + ' <' + req.credentials.email + '>',
		to: req.param('to'),
		subject: req.param('subject'),
		html: req.param('html')
	}

	_.defaults(email, {
		to: req.credentials.email,
		subject: "",
		text: "No Text",
		html: ""
	})

	// Dispatch Email
	req.galleon.dispatch(email)

	res.json({ success: true })
}
