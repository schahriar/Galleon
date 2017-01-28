module.exports = {
  /*
   - LOGIN METHOD -
   Accepts:
   @ email -> String
   @ password -> String
  */
  login: function (req, res) {
    /* Improve code
    // Logout if already logged
  if(req.credentials){
        req.signOut(req, res, function(error){
            req.signIn(req, res, function(error){
                if(error) return res.json({ error: error });
                res.json({ success: true });
            })
        })
    }*/

    // Login
    req.signIn(req, res, function (error) {
      if (error) return res.json({ error: error, success: false });
      res.json({ success: true });
    })
  },
  logout: function (req, res) {
    req.signOut(req, res, function (error) {
      if (error) return res.json({ error: error, success: false });
      res.json({ success: true });
    })
  },
  changePassword: function (req, res) {
    req.changePassword(req, res, function (error) {
      if (error) return res.json({ error: error, success: false });
      // Logout after password change
      req.signOut(req, res, function (error) {
        if (error) return res.json({ error: error, success: false });
        res.json({ success: true });
      })
    })
  }
}
