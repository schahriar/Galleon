module.exports = function(req, res) {
	req.galleon.query('delete', { eID: req.param('eID'), email: req.credentials.email }, function(error) {
		if(error) return res.status(500).json({ error: error });
		res.json({ success: true })
	});
}
