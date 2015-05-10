var fs = require('fs');
var path = require('path');

module.exports = function(Galleon, id, raw) {
    fs.writeFile(path.resolve(Galleon.environment.paths.raw, "_raw_" + id), raw, function(error) {
        // Ignore if failed since storage of raw emails is not the priority
        if (error) console.log("COULD NOT STORE ->", { id: id, error: error });
    });
}
