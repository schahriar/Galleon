var _ = require('lodash');

module.exports = function (req, res) {
  req.galleon.query('get',
    {
      email: req.credentials.email,
      page: parseInt(req.param("page")) || 1,
      folder: (req.param("folder") != undefined) ? req.param("folder") : 'inbox'
    },
    function (error, emails, stats) {
      if (error) res.status(500).json({
        error: error
      });

      res.json({
        folder: stats.folder,
        total: stats.total,
        page: stats.page,
        pages: stats.total / stats.limit,
        showing: stats.limit,
        results: emails
      });
    })
}
