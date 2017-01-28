module.exports = function (req, res) {
  req.getCredentials(function (error, credentials) {
    if (error) res.json({ authenticated: false });
    else res.json({ authenticated: credentials });
  });
}
