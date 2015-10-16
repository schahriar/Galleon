// Essentials
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

module.exports = function(_this, database, session, parsed, raw, labResults){
    if(!labResults) labResults = new Object;

    // Formats from to -> Name <email>
    if(_.isPlainObject(parsed.from))
        parsed.from = parsed.from.name + ' <' + parsed.from.address + '>';
    else if(_.isArray(parsed.from))
        parsed.from = parsed.from[0].name + ' <' + parsed.from[0].address + '>';
    else {
        return console.error("FAILED TO PARSE HEADER\nIGNORING MAIL");
    }

    // Sets association to envelope's receiver
    parsed.associtaion = parsed.envelopeTo[0].address;
    // --------------------- //
    
    var email = {
        association: [parsed.associtaion],
        sender: parsed.from,
        receiver: parsed.headers.to || parsed.associtaion,
        to: parsed.toAll,
        stamp: { sent: (new Date(parsed.date)), received: (new Date()) },
        subject: parsed.subject,
        text: parsed.text,
        html: parsed.html,

        read: false,
        trash: false,

        dkim: (parsed.dkim === "pass"),
        spf: (parsed.spf === "pass"),

        spam: labResults.isSpam || false,
        spamScore: labResults.spamScore || 0,

        // STRING ENUM: ['pending', 'approved', 'denied']
        state: 'approved'
    }
    
    // Load incoming modules
	_this.environment.modulator.launch(_this.environment.modules['incoming'], parsed.associtaion, email, parsed, raw, function(error, _email, _ignore){
		console.log("INCOMING MODULES LAUNCHED".green, arguments);
        
        // Ignore email if requested
        if(_ignore === true) return _this.emit('ignored', session, parsed, raw, database);
        
        // Assign modified ~email~ object if provided
        if(!_email) _email = email;
        // Create a new mail in the database
        database.collections.mail.create(_email, function(error, model){
            if(error){
                console.error(error, 'error');
    
                // Emits 'mail' event with - SMTP Session, Mail object, Raw content, Database failure & Database object
                _this.emit('mail', session, parsed, raw, error, database);
            }else{
                // Store raw email
                if (_.has(_this.environment, 'paths.raw')) {
                    fs.rename(session.path, path.resolve(path.dirname(session.path), model.eID), function(error) {
                        if (error) {
                            console.log("INCOMING-STORE-ERROR", error);
                            // Rename failed remove temp file
                            fs.unlink(session.path, function(error) {
                                if (error) console.log("INCOMING-STORE-ERROR->RAW-UNLINK-ERROR", error);
                            })
                        }
                    })
                } else {
                    fs.unlink(session.path, function(error) {
                        if (error) console.log("INCOMING-STORE-UNLINK-ERROR", error);
                    })
                }
    
                // Add attachments to Mail
                _this.attach(database, model.eID, parsed.attachments);
    
                // Emits 'mail' event with - SMTP Session, Mail object, Raw content, Database model & Database object
                _this.emit('mail', session, parsed, raw, model, database);
            }
        });
    })
}
