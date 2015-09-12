var path = require('path');

module.exports = function(req, res) {
    req.galleon.query('getAttachment', { eID: req.params.eID, email: req.credentials.email, id: req.params.id.toString() }, function(error, attachment){
        if (error) return res.status(400).json({ error: error.toString() })
        if (attachment.cid) {
            console.log("CID ATTACHMENT", attachment)
            res.type(attachment.name);
            res.sendFile(path.basename(attachment.path), {
                root: path.dirname(attachment.path),
                dotfiles: 'deny',
                headers: {
                    'x-timestamp': Date.now(),
                    'x-sent': true
                }
            }, function(error) {
                console.log(error)
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
