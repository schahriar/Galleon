module.exports = function(req, res) {
    req.galleon.query('attachment', { eID: req.params.eID, email: req.credentials.email, id: req.params.id.toString() }, function(error, attachment){
        if (attachment.cid) {
            res.type(attachment.name);
            res.sendFile(attachment.path, {
                dotfiles: 'deny',
                headers: {
                    'x-timestamp': Date.now(),
                    'x-sent': true
                }
            }, function(error) {
                if (error) res.status(error.status).end();
            })
        }
        else {
            res.download(attachment.path, attachment.name, function(error) {
                if (error) res.status(error.status).end();
            });
        }
    })
}
