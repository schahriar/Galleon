var path = require('path');
var Galleon = require('./../../Galleon.js');
var herb =   require('herb');

exports = module.exports = function(){
    return function galleon(req, res, next){

        var g = new Galleon({});
        console.log(g);
        req.galleon = g;

        next();
    }
}
