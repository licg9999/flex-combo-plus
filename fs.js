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
        return new Promise(function (resolve, reject) {
            fs.exists(pathVal, function(b){
                resolve(b);
            });
        });
    },
    
    readFile: function(pathVal){
        return new Promise(function (resolve, reject) {
            preproc(pathVal)
                .then(function(pair){
                    log(('Disapathed to Local').cyan +
                        (': [' + pair[1] + ']').grey);
                    resolve(pair);
                })
                .catch(function(err){
                    reject(err);
                });

        });
    },

    stat: function(pathVal){
        return new Promise(function (resolve, reject) {
            fs.stat(pathVal, function(err, stats){
                if(err){
                    reject(err);
                }else {
                    resolve(stats);
                }
            });
        });
    }
};
