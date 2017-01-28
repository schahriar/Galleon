module.exports = function (req, res) {
  var credentials = req.credentials;

  var apply = new Object;

  if (req.param('read') !== undefined) apply.read = (!!req.param('read')) || false;
  if (req.param('spam') !== undefined) apply.spam = (!!req.param('spam')) || false;
  if (req.param('trash') !== undefined) apply.trash = (!!req.param('trash')) || false;

  /* Add credentials check here */
  req.galleon.query('mark', { eID: req.param('eID'), email: req.credentials.email, apply: apply }, function (error, model) {
    if (error) return res.status(500).json({ error: error });
    res.json({ success: true })
  })
}
