var fs = require('fs');

var less = require('less');
var npmimport = new (require('less-plugin-npm-import'))();

var REG_PATH_EXT_CSS = /\.css$/;


module.exports = function(pathVal){
    var deferred = Promise.defer();

    var pathTar;
    if(REG_PATH_EXT_CSS.test(pathVal)){

        // less preprocess
        pathTar = pathVal.replace(REG_PATH_EXT_CSS, '.less');
        fs.exists(pathTar, function(exists){
            if(exists){
                fs.readFile(pathTar, {}, function(err, data){
                    less.render(data.toString(), { 
                        sourceMap: {
                            sourceMapFileInline: false
                        },
                        plugins: [ npmimport ]
                    })
                    .then(function(o){
                        deferred.resolve([new Buffer(o.css), pathTar]);
                    })
                    .catch(function(err){
                        deferred.reject(err);
                    });
                });
            }else {
                fs.readFile(pathVal, {}, function(err, data){
                    if(err){
                        deferred.reject(err);
                        return;
                    }
                    deferred.resolve([data, pathVal]);
                });
            }
        });
    }else {
        fs.readFile(pathVal, {}, function(err, data){
            if(err){
                deferred.reject(err);
                return;
            }
            deferred.resolve([data, pathVal]);
        });
    }

    return deferred.promise;
};
