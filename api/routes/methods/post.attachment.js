module.exports = function (req, res) {
  req.galleon.query('linkAttachment', { eID: req.params.eID, email: req.credentials.email, file: req.file, body: req.body }, function (error, result) {
    if (error) res.json({ error: error });
    else res.json({ success: true, ref: (!!result) ? result.ref : undefined });
  })
}