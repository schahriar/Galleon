var Galleon = require('./Galleon');

var g = new Galleon({});
g.on('ready', function(){ 
    g.dock(function(error, incoming){
    	if(error) return console.log(error);
    	else console.log("Connection Established.");

    	incoming.on('mail', function(connection, mail){
        	console.log(mail.from);
        	console.log(mail.subject);
        	console.log(mail.text);
    	});
    });
})
