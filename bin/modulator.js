var shell = require('shelljs');
var _ = require('lodash');
var async = require('async');
var herb = require('herb');
var colors = require('colors');
var configFile = require('./configFile');

var Modulator = function() {
    this.env = configFile;
    this.modules = this.env.getModulesSync();
    this.container = {};
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
        if(!context.container[MODULE.extends]) context.container[MODULE.extends] = [];
        // Push current Module to the respective key
        context.container[MODULE.extends].push(MODULE);
    });
    return context.container;
};

Modulator.prototype.launch = function() {
    var context = this;
    var args = _.toArray(arguments);
    var cat = args.shift();
    var callback = args.pop();
    var functions = [];
    
    if((!context.container) || (!_.isPlainObject(context.container)) || (!context.container[cat])) return callback();
    
    // Populate functions
    _.each(context.container[cat], function(MODULE) {
        functions.push(function(callback){
            /* Slows down module execution but prevents unintended crashes */
            // Prevents a bad module from corrupting the entire eco-system
            try {
                context.container[cat][MODULE.name].__gcopy = require(MODULE.reference);
                context.container[cat][MODULE.name].__gcopy.exec.apply(MODULE, args);
            }catch(error){
                callback(error);
            }
        });
    });
    
    // Watch for config changes
    configFile.watch(function() {
        var newConfig = context.env.getModulesSync();
        _.each(context.container[cat], function(MODULE) {
            if(!_.isEqual(MODULE.config, newConfig.container[cat][MODULE.name])) {
                try {
                    if(MODULE.__gcopy.update) { MODULE.__gcopy.update(newConfig.container[cat][MODULE.name].config); }
                }catch(e) {}
            }
        });
        context._getModules();
    });
    
    // Ignore if no modules are registered for the current task
    if(functions.length <= 0) return callback();
    
    async.series(functions, callback);
};

Modulator.prototype.install = function(moduleName) {
    var context = this;
    moduleName = moduleName.toLowerCase();
    moduleName = (moduleName.substring(0,8) !== 'galleon-')?'galleon-'+moduleName:moduleName;
    shell.exec('npm install -g ' + moduleName, function(code, output) {
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