![Galleon Logo](logo.png)

A badass SMTP mail server built on Node to make your life simpler.
======

## Basic Mail Listener
```javascript
var Galleon = require('Galleon');

Galleon.dock({port:25}, function(error, incoming, outgoing){
	if(!error) return console.log(error);
	else console.log("Connection Established");
	
	incoming.on('mail', function(connection, mail){
		console.log(mail.from);
		console.log(mail.subject);
		console.log(mail.text);
	});
});
```

## Status
![status](http://img.shields.io/badge/Production%20ready-nope%20(expect%20it%20in%208%20days)-red.svg?style=flat-square)

![version](http://img.shields.io/badge/Version-0.1.1%20(Speedy Mess)-bdc3c7.svg?style=flat-square)