var pm2 = require('pm2');
var _ = require('lodash');
var path = require('path');

// Thanks to https://gist.github.com/timoxley/1689041
var isPortTaken = function(port, fn) {
  var net = require('net')
  var tester = net.createServer()
  .once('error', function (err) {
    if (err.code != 'EADDRINUSE') return fn(err)
    fn(null, false)
  })
  .once('listening', function() {
    tester.once('close', function() { fn(null, true) })
    .close()
  })
  .listen(port)
}

module.exports = function() {
	// Connect or launch PM2
	pm2.connect(function(error) {
        if(error) throw error;

        pm2.list(function(error, list){
            if(error) throw error;
            if(_.findWhere(list, { name: 'galleon-instance'} )) {
                console.error("Instance already exists!".red, "\nTRY", "galleon restart".magenta);
                process.exit(0);
            } 

    		isPortTaken(25,function (error, available) {
    			if(error || !available) {
    				console.log("PORT 25 is not available", "\nTRY", "authbind --deep galleon start".magenta, "\nFind More info about authbind -> https://github.com/schahriar/Galleon/blob/master/tutorials/AUTHBIND.md")
    				process.exit(0);
    			}

    			// Start a script on the current folder
                /* BADPATCH -- There are significant issues with providing PM2 with a local script (https://github.com/schahriar/Galleon/issues/2). Start.JS should implement fallback methods and use a launch script inside the .galleon folder by default.  */
    			pm2.start(path.resolve(__dirname, '../galleon.js'), { name: 'galleon-instance', force : true, scriptArgs: process.argv, nodeArgs: "--max_old_space_size=300" }, function(err, proc) {
    				if(err) return new Error(err);

    				// Get all processes running
    				pm2.list(function(err, process_list) {
    					console.log("Process Started".green);
    					console.log("Type".cyan + " galleon status ".bold + "to display status of the instance/process".cyan);

    					// Disconnect to PM2
    					pm2.disconnect(function() { process.exit(0) });
    				});
    			});
    		})
        })
	})
}
