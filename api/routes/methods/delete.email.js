module.exports = function(req, res) {
	var credentials = req.credentials;
	req.galleon.query('delete', { eID: req.param('eID') }, function(error) {
		if(error) return res.status(500).json({ error: error });
		res.json({ success: true })
	});
}
