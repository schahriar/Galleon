require('shelljs/global');
var herb = require('herb');
var colors = require('colors');
var environment = require('../environment');

function addModule(MODULE) {
    var m = require(MODULE);
    environment.addModules([{
        reference: MODULE,
        name: m.name,
        extends: m.extends,
        config: m.defaults
    }]);
}

module.exports = function(name) {
    var name = name.toLowerCase();
    var moduleName = (name.substring(0,8) !== 'galleon-')?'galleon-'+name:name;
    var npm = exec('npm install -g ' + moduleName, function(code, output) {
      if(code == 0) {
          addModule(moduleName);
          herb.log(name.toUpperCase().magenta, "SUCCESSFULLY INSTALLED!".green);
          herb.warn("Changes will only take affect after restart!");
      }else{
          herb.log("INSTALLATION FAILED!".red, "\nCODE:", code);
      }
    });
}
