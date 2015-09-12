module.exports = function(req, res) {
    req.galleon.query('unlinkAttachment', { eID: req.params.eID, email: req.credentials.email, ref: req.params.ref }, function(error){
        if(error) res.json({ error: error });
        else res.json({ success: true });
    })
}