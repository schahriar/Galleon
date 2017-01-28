var _ = require('lodash');
var colors = require('colors'); // Better looking error handling
var pm2 = require('pm2');

module.exports = function (Galleon, argv) {
  // Connect or launch PM2
  pm2.connect(function (err) {
    if (err) return new Error(err);
    // Get all processes running
    pm2.list(function (err, process_list) {
      if (err) throw err;
      /* USE ASYNC HERE LATER */
      _.each(process_list, function (process, count) {
        console.log((count + 1 + ":").error, ("PID " + process.pid).yellow, '\t', process.name.magenta, '\t', process.pm2_env.status.green);
      })
      process.exit(0);
    });
  })
}
