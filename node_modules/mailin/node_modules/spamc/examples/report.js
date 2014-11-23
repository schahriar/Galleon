/**
 * User: Carl Glaysher
 * Date: 17/03/2012
 * Time: 08:46
 * Description: Front end to check spamc client
 */
var spamc = require('../index');
var client = new spamc();

client.report('My Message as String',function(err, result){
    if (err) console.log(err.stack);

    console.log('Spamassassin report:');
    console.log(result);
});

/* Example Response
 {
    responseCode: 0,
    responseMessage: 'EX_OK',
    isSpam: true,
    spamScore: 6.9,
    baseSpamScore: 5,
    report:[
        {
            score: '0.0',
            name: 'NO_RELAYS',
            description: 'Informational',
            type: 'message'
        }
    ]
 }
*/
