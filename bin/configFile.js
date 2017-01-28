var osenv = require('osenv');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

function createDirectoryIfNotFound() {
  var dir = path.resolve.apply(null, arguments);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
}

var defaultPath = path.resolve(osenv.home(), '.galleon/galleon.conf');
createDirectoryIfNotFound(path.resolve(osenv.home(), '.galleon'));

var env = {
  watch: function (callback) {
    if (typeof callback === 'function') callback = _.noop();
    // Listens to config file
    // and calls callback when changed
    fs.watchFile(defaultPath, function (curr, prev) {
      if (curr.mtime > prev.mtime) {
        env.get(function (error, data) {
          callback(error, data, curr, prev);
        });
      }
    });
  },
  get: function (callback) {
    if (typeof callback === 'function') callback = _.noop();
    fs.exists(defaultPath, function (exists) {
      if (!exists) return callback("CONFIG FILE NOT FOUND!");
      fs.readFile(defaultPath, 'utf8', function (error, data) {
        if (error) return callback(error);
        callback(null, JSON.parse(data));
      });
    });
  },
  getSync: function () {
    if (!fs.existsSync(defaultPath)) return {};
    return JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
  },
  getModulesSync: function () {
    return this.getSync().modules;
  },
  set: function (obj, callback) {
    if (typeof callback === 'function') callback = _.noop();
    fs.writeFile(defaultPath, JSON.stringify(obj, null, 2), function (error) {
      if (error) return callback(error);
      if (callback) callback();
    });
  },
  setSync: function (obj) {
    return fs.writeFileSync(defaultPath, JSON.stringify(obj, null, 2));
  },
  setModules: function (modules, callback) {
    if (typeof callback === 'function') callback = _.noop();
    var self = this;
    modules = _.toArray(modules);
    self.get(function (error, data) {
      if (error) return callback(error);

      data.modules = modules;
      self.set(data, callback);
    });
  },
  updateModuleConfig: function (Module, Config, callback) {
    if (typeof callback === 'function') callback = _.noop();
    var self = this;
    self.get(function (error, data) {
      if (error) return callback(error);
      var MODULE = _.findWhere(data.modules, { name: Module.name });
      MODULE.config = _.merge(MODULE.config, Config);
      if (typeof (callback) === 'function') self.set(data, callback);
      else self.setSync(data);
    });
  },
  addModules: function (modules, callback) {
    if (typeof callback === 'function') callback = _.noop();
    var self = this;
    modules = _.toArray(modules);
    self.get(function (error, data) {
      if (error) return callback(error);
      _.each(modules, function (MODULE) {
        if (!data.modules) data.modules = [];
        _.remove(data.modules, { name: MODULE.name });
        data.modules.push(MODULE);
      });
      self.set(data, callback);
    });
  },
  removeModules: function (modules, callback) {
    if (typeof callback === 'function') callback = _.noop();
    var self = this;
    modules = _.toArray(modules);
    self.get(function (error, data) {
      if (error) return callback(error);

      _.each(modules, function (MODULE) {
        _.pull(data.modules, MODULE);
      });
      self.set(data, callback);
    });
  },
};

module.exports = env;
