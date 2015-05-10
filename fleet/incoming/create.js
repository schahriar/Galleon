// Functions
var store = require("./store");

module.exports = function(_this, database, connection, parsed, raw, labResults){
    if(!labResults) labResults = new Object;

    // Tiny bit of arranging //

    // Formats from to -> Name <email>
    if(parsed.from.constructor === Array)
        parsed.from = parsed.from[0].name + ' <' + parsed.from[0].address + '>';
    else
        parsed.from = parsed.from.name + ' <' + parsed.from.address + '>';

    // Sets association to envelope's receiver
    parsed.associtaion = parsed.envelopeTo[0].address;
    // --------------------- //
    console.log(parsed.associtaion);

    // Create a new mail in the database
    database.collections.mail.create({
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
    }, function(error, model){
        if(error){
            console.error(error, 'error');

            // Emits 'mail' event with - SMTP Connection, Mail object, Raw content, Database failure & Database object
            _this.emit('mail', connection, parsed, raw, error, database);
        }else{
            // Store raw email
            store(_this, model.eID, raw);

            // Add attachments to Mail
            _this.attach(database, model.eID, parsed.attachments);

            // Emits 'mail' event with - SMTP Connection, Mail object, Raw content, Database model & Database object
            _this.emit('mail', connection, parsed, raw, model, database);
        }
    });
}
