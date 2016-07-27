/* jshint evil:true */
/* globals buildOneJS, buildOneCSS */

/**
@exports: Object
        .exists: function(){
            pathVal: string
            @return: Promise
        }
        .readFile: function(pathVal){
            pathVal: string
            @return: Promise
        }
        .stat: function(path){
            pathVal: string
            @return: Promise
        }
**/

require('colors');
var fs = require('fs');
var log = require('./log');
var preproc = require('./preproc');

module.exports = {
    exists: function(pathVal){
        var deferred = Promise.defer();
        fs.exists(pathVal, function(b){
            deferred.resolve(b);
        });
        return deferred.promise;
    },
    
    readFile: function(pathVal){
        var deferred = Promise.defer();

        preproc(pathVal)
        .then(function(pair){
            log(('Disapathed to Local').cyan +
                (': [' + pair[1] + ']').grey);
            deferred.resolve(pair);
        })
        .catch(function(err){
            deferred.reject(err);
        });

        return deferred.promise;
    },

    stat: function(pathVal){
        var deferred = Promise.defer();
        fs.stat(pathVal, function(err, stats){
            if(err){
                deferred.reject(err);
            }else {
                deferred.resolve(stats);
            }
        });
        return deferred.promise;
    }
};
