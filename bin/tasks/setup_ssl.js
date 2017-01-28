"use strict";

var _ = require('lodash');
var async = require('async');
var herb = require('herb');
var colors = require('colors');
var osenv = require('osenv');
var fs = require('fs');
var path = require('path');
var inquirer = require('inquirer');
var askFor = require('./_questionnaire');
var crypto = require('crypto');
var configFile = require('../configFile');

var config = _.defaults(configFile.getSync(), {
  connections: {
    storage: new Object,
    authentication: new Object
  },
  paths: new Object,
  modules: [],
  secret: crypto.randomBytes(20).toString('hex'),
  ssl: {
    use: false,
    incoming: {
      cert: undefined,
      key: undefined
    },
    api: {
      cert: undefined,
      key: undefined
    }
  }
});

var defaultDirectory = path.resolve(osenv.home(), '.galleon/');

module.exports = function (callback) {
  askFor.ssl(function (answers) {
    if (answers.shouldUseSSL) {
      config.ssl = {
        use: true,
        incoming: {
          cert: answers['ssl-smtp-cert'],
          key: answers['ssl-smtp-key'],
          ca: answers['ssl-smtp-ca']
        },
        api: {
          cert: answers['ssl-api-cert'],
          key: answers['ssl-api-key'],
          ca: answers['ssl-api-ca']
        }
      }
    }

    // Log action
    herb.marker({
      color: 'green'
    }).log('Updating config file ...');

    // Write config to config file
    fs.writeFile(path.resolve(defaultDirectory, 'galleon.conf'), JSON.stringify(config, null, 2), function (error) {
      if (error) herb.error(error);
      herb.log('SSL CONFIG SUCCESSFUL!');
      herb.log('Get yourself started by typing', colors.magenta('galleon restart'), 'in order to restart Galleon!');
      process.exit(0);
    });

  })
}