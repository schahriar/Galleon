module.exports = function(req, res){
    console.log("CHECKING CREDENTIALS");
    req.getCredentials(function(error, credentials){
		if(error) res.json({ authenticated: false });
		else res.json({ authenticated: credentials });
	});
}
