var _ = require('lodash');

module.exports = function(email, page) {
    var folders = new Object;
    
    /*
    HUGE MEMORY ALLOCATION PER REQUEST
    SELECTION SHOULD BE LIMITED TO A FOLDER
    & A SINGLE OBJECT IN FUTURE RELEASES.
    */
    
    folders.OUTBOX = {
        collection: 'queue',
        find: new Object,
        where: {
            association: email,
            state: { '!=': 'draft' } /* MIGHT CAUSE POSTGRES ISSUES -> http://stackoverflow.com/a/22600564/804759 */
        },
        sort: {
            createdAt: 'desc'
        },
        paginate: {
            page: page || 1,
            limit: 10
        },
        filter: function(mails) {
            // Sort (Time asc) & Filter - Note: Sorting could be moved to Waterline native sorting
            return _.chain(mails)
                .map(function(t) {
                    // Filter
                    t = _.pick(t, ['eID', 'sender', 'to', 'schedule', 'subject', 'text', 'html', 'attachments']);
                    // Remove path from Attachments
                    t.attachments = _.map(t.attachments, function(attachment) {
                        return _.pick(attachment, ['fileName', 'checksum', 'id', 'length']);
                    });
                    // Prepend Indicator to the eID
                    t.eID = 'O' + t.eID;
                    // Set all Outbox emails to read/!spam/!trash
                    t.read = true;
                    t.spam = false;
                    t.trash = false;
                    // Stamp doesn't exist in QUEUE so we create it here
                    t.stamp = {
                        sent: (new Date(t.schedule.scheduled)),
                        received: (new Date(t.schedule.attempted))
                    }
                    // Pass to sort
                    return t;
                })
                .sortBy(function(t) {
                    return (t.stamp.sent.getTime())
                })
                .value();
        }
    }
    
    folders.DRAFT = _.extend(_.clone(folders.OUTBOX, true), {
        where: {
            association: email,
            state: 'draft'
        },
    });

    folders.INBOX = {
        collection: 'mail',
        find: new Object,
        where: {
            association: email,
            trash: false,
            spam: false,
            sent: false,
            spamScore: {
                '<=': 5
            } /* Spam filter */
        },
        sort: {
            createdAt: 'desc'
        },
        paginate: {
            page: page,
            limit: 10
        },
        filter: function(mails) {
            // Sort (Time asc) & Filter - Note: Sorting could be moved to Waterline native sorting
            return _.chain(mails)
                .map(function(t) {
                    // Filter
                    t = _.pick(t, ['eID', 'sender', 'receiver', 'to', 'stamp', 'subject', 'text', 'html', 'read', 'spam', 'trash', 'attachments']);
                    // Remove path from Attachments
                    t.attachments = _.map(t.attachments, function(attachment) {
                        return _.pick(attachment, ['fileName', 'checksum', 'id', 'length']);
                    });
                    // Prepend Indicator to the eID
                    t.eID = 'I' + t.eID;
                    // Covert stamps to JS Dates
                    t.stamp.sent = (new Date(t.stamp.sent));
                    t.stamp.received = (new Date(t.stamp.received));
                    // Pass to sort
                    return t;
                })
                .sortBy(function(t) {
                    return (t.stamp.sent.getTime())
                })
                .value();
        }
    }

    folders.SENT = _.extend(_.clone(folders.INBOX, true), {
        where: {
            association: email,
            sent: true,
			spam: false,
			trash: false,
        },
    });

    folders.SPAM = _.extend(_.clone(folders.INBOX, true), {
        where: {
            association: email,
            trash: false,
            or: [{
                spam: true
            }, {
                spamScore: {
                    '>': 5
                }
            }]
        },
    });

    folders.TRASH = _.extend(_.clone(folders.INBOX, true), {
        where: {
            association: email,
            trash: true
        },
    });

    return folders;
}
