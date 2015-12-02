var shell = require('shelljs');
var _ = require('lodash');
var async = require('async');
var herb = require('herb');
var colors = require('colors');
var configFile = require('./configFile');

var Modulator = function() {
    this.env = configFile;
    this.modules = this.env.getModulesSync();
};

Modulator.prototype._getModules = function() {
    this.modules = this.env.getModulesSync();
};

Modulator.prototype._add = function (MODULE) {
    var m = require(MODULE);
    this.env.addModules([{
        reference: MODULE,
        name: m.name,
        extends: m.extends,
        config: m.defaults
    }]);
};

Modulator.prototype.load = function(modules) {
    var context = this;
    // Modules are likely required to be loaded on start thus will be loaded Synchronously
    _.each(modules || context.modules, function(MODULE) {
        // Fill context.modules according to 'extends' attribute

        // Assign array if key is undefined
        if(!context.modules[MODULE.extends]) context.modules[MODULE.extends] = [];
        // Push current Module to the respective key
        context.modules[MODULE.extends].push(MODULE);
    });
    return context.modules;
};

Modulator.prototype.launch = function() {
    var args = _.toArray(arguments);
    var cat = args.shift();
    var callback = args.pop();
    var functions = [];
    // Populate functions
    _.each(this.modules[cat], function(MODULE) {
        functions.push(function(callback){
            /* Slows down module execution but prevents unintended crashes */
            // Prevents a bad module from corrupting the entire eco-system
            try {
                require(MODULE.reference).exec.apply(MODULE, args);
            }catch(error){
                callback(error);
            }
        });
    });
    
    // Watch for config changes **
    
    // Ignore if no modules are registered for the current task
    if(functions.length <= 0) return callback();
    
    async.series(functions, callback);
};

Modulator.prototype.install = function() {
    var context = this;
    var name = name.toLowerCase();
    var moduleName = (name.substring(0,8) !== 'galleon-')?'galleon-'+name:name;
    var npm = shell.exec('npm install -g ' + moduleName, function(code, output) {
      if(code === 0) {
          context._add(moduleName);
          herb.log(name.toUpperCase().magenta, "SUCCESSFULLY INSTALLED!".green);
          herb.warn("Changes will only take affect after restart!");
      }else{
          herb.log("INSTALLATION FAILED!".red, "\nCODE:", code);
      }
    });
};

Modulator.prototype.update = function(name, config) {
    var context = this;
    var MatchFound = false;
    // Modules are likely required to be loaded on start thus will be loaded Synchronously
    _.each(this.modules, function(MODULE) {
        // If Current Module Matches name
        if((MODULE.name.toLowerCase() === name) || (MODULE.reference.toLowerCase() === name)) {
            // Update Config
            context.env.updateModuleConfig(MODULE, config);
            MatchFound = true;
        }
    });
    return MatchFound;
};

module.exports = Modulator;