var pathLib = require("path");
var fsLib   = require("fs");
var merge   = require("merge");
var mkdirp  = require("mkdirp");

exports.init = function(confFile, param) {
    var confDir = pathLib.dirname(confFile);
    if (!fsLib.existsSync(confDir)) {
        mkdirp.sync(confDir, {mode: 0777});
    }

    if (!fsLib.existsSync(confFile)) {
        fsLib.writeFileSync(confFile, JSON.stringify(param, null, 4), {encoding:"utf-8"});
    }
    else {
        param = merge.recursive(param, JSON.parse(fsLib.readFileSync(confFile, {encoding:"utf-8"})));
    }

    return param;
}

exports.merge = merge;