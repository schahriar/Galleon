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
var Database = require('../../fleet/connection');
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

function createDirectoryIfNotFound() {
  var dir = path.resolve.apply(null, arguments);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
}

function checkDatabaseConnection(callback) {
  askFor.database().then(function (answers) {
    config.connections.storage = {
      adapter: answers.adapter,
      host: answers.host,
      port: answers.port,
      user: answers.user,
      password: answers.password,
      database: answers.database_name
    }
    config.connections.authentication = config.connections.storage;

    try {
      // Log next action
      herb.marker({
        color: 'green'
      }).log('Checking database connection ...');
      Database(config.connections, function (error, connection) {
        if (error) {
          herb.line('-  -');
          herb.warning("Database connection could not be made! Try again.")
          return checkDatabaseConnection(callback);
        } else callback();
      })
    } catch (error) {
      return callback(error);
    }
  }).catch((error) => {
    throw error;
  });
}

module.exports = function (Galleon) {
  async.waterfall([
    function (callback) {
      askFor.domain().then(function (answer) {
        config.domain = answer.domain;
        callback();
      }).catch((error) => {
        throw error;
      });
    },
    function (callback) {
      createDirectoryIfNotFound(defaultDirectory);
      askFor.directory().then(function (answers) {
        if (answers.perform.indexOf('attachments') + 1) config.paths.attachments = answers.location_attachments || createDirectoryIfNotFound(defaultDirectory, 'attachments/');
        if (answers.perform.indexOf('raw') + 1) config.paths.raw = answers.location_raw || createDirectoryIfNotFound(defaultDirectory, 'raw/');
        callback();
      }).catch((error) => {
        throw error;
      });
    },
    checkDatabaseConnection
  ], function (error, result) {
    if (error) return herb.error(error, "\nPlease retry again!");

    // Log action
    herb.marker({
      color: 'green'
    }).log('Creating config file ...');

    // Write config to config file
    fs.writeFile(path.resolve(defaultDirectory, 'galleon.conf'), JSON.stringify(config, null, 2), function (error) {
      if (error) herb.error(error);
      herb.log('CONFIG SUCCESSFUL!');
      herb.log('Get yourself started by typing', colors.magenta('galleon start'), 'in order to launch an instance of Galleon!');
      process.exit(0);
    });
  });
}
