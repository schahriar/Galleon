var _ = require('lodash');

module.exports = function(email, page) {
    var folders = new Object;

    folders.INBOX = {
        collection: 'mail',
        find: new Object,
        where: {
            association: { contains: email },
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
            association: { contains: email },
            sent: true,
			spam: false,
			trash: false,
        },
    });

    folders.SPAM = _.extend(_.clone(folders.INBOX, true), {
        where: {
            association: { contains: email },
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
            association: { contains: email },
            trash: true
        },
    });

    return folders;
}
