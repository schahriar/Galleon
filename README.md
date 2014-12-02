![Galleon Logo](logo.png)

A badass SMTP mail server built on Node to make your life simpler.
======

**\*Galleon** is a super fast & efficient mail server powered by **Node.JS**, **coffee** *(talking about the magical liquid here)* and our favorite Document Database **MongoDB**. It will feature all the awesome stuff the big providers have yet provides you with a powerful API to expand it on your own.

Get ready to sail into a new world featuring:
- ~~***Michael Bay explosions***~~ *fixed*
- Web based user interface (Available in beta release)
- Spam protection by default (Almost fully implemented)
- Simple Mail Transfer Protocol on your preferred ports (Listen, Process, Send)
- Connection control (ratelimiting, bandwith limiting and other terms that makes me sound professional)
- Did I mention super fast? (Blame it on Node)

[**\*Galleon**](http://en.wikipedia.org/wiki/Galleon) is named after multi-deck armed merchant ships dating back to 16th century.

# Installation
[Installation](tutorials/INSTALLATION.md) can be as simple as this:
```javascript
npm install Galleon
```
[Visit the tutorial for more info.](tutorials/INSTALLATION.md)

# Why ditch your old Mail Servers?
---------
> Are you tired of paying insane amounts of money for uselss services that come bundled with your email service subscription?

> Are you tired of spending a ton of more money on a specialist to set up a mail server for you using ancient technology just because you can't get it up and running yourself?

> Are you tired of setting up 3-5 different applications on your server to get be able to receive email?

> Are you tired of seeing mediocre marketing questions?

> ###### Are you tired?

----------
Well, **Galleon** is your solution. All you need is a server a domain name and a basic setup to get a complete mail server up which can serve a ton of other domains and users but guess what? We'll cover all the steps in this same repository. The goal is to make it easy and secure for all developers to have their own private domain running.

# Application Programming Interface (API)
**Note:** The Alpha version will not include automation tools and web/user interfaces. This is to build a useful API to be integrated into porjects. This API will later be moved to a different repo or branch for developer access.

### Get email by docking Galleon
```javascript
var Galleon = require('Galleon');

Galleon.dock({port:25}, function(error, incoming){
	if(error) return console.log(error);
	else console.log("Connection Established.");
	
	incoming.on('mail', function(connection, mail){
		console.log(mail.from);
		console.log(mail.subject);
		console.log(mail.text);
	});
});
```
### Send email by dispatching
```javascript
var Galleon = require('Galleon');

Galleon.dispatch({
		from:    'john.smith@example.com',
		to:      'john.doe@example.com',
		subject: 'We have Galleon running!',
		text:    'We now have a mail server running!',
		html:    '<h2>We now have a mail server running!</h2><hr>This is amazing<br><br><br><hr><b>John Smith</b>'
		
	}, function(error, response){
		if(error) return console.log(error);
		
		console.log("Email Sent.");
		console.log("Receiving Server responded\n" + response);
	}
});
```
# License
Who doesn't love a [MIT license](https://raw.githubusercontent.com/schahriar/Galleon/master/LICENSE)?
Make sure you read the license and don't participate in any form of abuse (Spam, etc.) using any parts of this project.

## Status
--------
`Beta version (0.2.x)` will eliminate most if not all the limitations of the current memory based system by implementing a database control system.

--------
![status](http://img.shields.io/badge/Production%20ready-nope%20(coming soon)-red.svg?style=flat-square)
![version](http://img.shields.io/badge/Version-0.1.3%20(Working Class Hero)-2ecc71.svg?style=flat-square)
