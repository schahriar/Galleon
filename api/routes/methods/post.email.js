var _ = require('lodash');

module.exports = function(req, res) {
	var email = {
		association: req.credentials.email,
		id: (req.param('id'))?req.param('id').substring(1):undefined,
		from: req.credentials.name + ' <' + req.credentials.email + '>',
		to: req.param('to'),
		subject: req.param('subject'),
		html: req.param('html'),
		draft: req.param('draft'),
		remove: req.param('remove')
	}

	_.defaults(email, {
		to: req.credentials.email,
		subject: "",
		text: "No Text",
		html: "",
		draft: false,
	})

	// Dispatch Email
	req.galleon.dispatch(email, function(error, queue){
		if(error) return res.json({ error: error });
		// Add 'O' for outgoing to eID
		res.json({ success: true, state: queue.state, id: (queue.eID)?('O' + queue.eID):undefined });
	})
}
