var osenv = require('osenv');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var defaultPath = path.resolve(osenv.home(), '.galleon/galleon.conf');

var env = {
    get: function(callback) {
        fs.exists(defaultPath, function (exists) {
            if(!exists) return callback("CONFIG FILE NOT FOUND!");
            fs.readFile(defaultPath, 'utf8', function (error, data) {
                if (error) return callback(error);
                callback(null, JSON.parse(data));
            });
        });
    },
    getSync: function() {
        if(!fs.existsSync(defaultPath)) return "CONFIG FILE NOT FOUND!";
        return JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
    },
    getModulesSync: function() {
        return this.getSync().modules;
    },
    set: function(obj, callback) {
        fs.writeFile(defaultPath, JSON.stringify(obj, null, 2), function (error) {
            if (error) return callback(error);
            if(callback) callback();
        });
    },
    setModules: function(modules, callback) {
        var self = this;
        var modules = _.toArray(modules);
        self.get(function(error, data) {
            if(error) return callback(error);

            data.modules = modules;
            self.set(data, callback);
        })
    },
    addModules: function(modules, callback) {
        var self = this;
        var modules = _.toArray(modules);
        self.get(function(error, data) {
            if(error) return callback(error);
            _.each(modules, function(MODULE) {
                if(!data.modules) data.modules = [];
                _.remove(data.modules, { name: MODULE.name });
                data.modules.push(MODULE);
            })
            self.set(data, callback);
        })
    },
    removeModules: function(modules, callback) {
        var self = this;
        var modules = _.toArray(modules);
        self.get(function(error, data) {
            if(error) return callback(error);

            _.each(modules, function(MODULE) {
                _.pull(data.modules, MODULE);
            })
            self.set(data, callback);
        })
    },
}

module.exports = env;