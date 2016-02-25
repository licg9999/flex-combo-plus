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
var pathLib = require('path');
var findup = require('find-up');
var Uglify = require('uglify-js');
var log = require('./log');

var REGEXP_JSFILE  = /\.js$/;
var REGEXP_CSSFILE = /\.css$/;
var REGEXP_STATEMENT_REQUIRE = /require\s*\(\s*[\'\"](.+)[\'\"]\s*\)/;
var REGEXP_CALL_GULPDEST = /\.dest\s*\(.*\)/;
var REGEXP_CALL_ON_ERROR = /\.on\s*\(\s*\'error\'\s*\,.*\)/;
var SYSTEM_MODULES = {
    'assert': true,
    'buffer': true,
    'child_process': true,
    'cluster': true,
    'console': true,
    'crypto': true,
    'dns': true,
    'events': true,
    'fs': true,
    'http': true,
    'https': true,
    'net': true,
    'os': true,
    'path': true,
    'process': true,
    'punycode': true,
    'querystring': true,
    'readline': true,
    'stream': true,
    'tls': true,
    'dgram': true,
    'url': true,
    'util': true,
    'vm': true,
    'zlib': true
};

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

        fs.readFile(pathVal, {}, function(err, data){
            if(err){
                deferred.reject(err);
                return;
            }
            log(('Disapathed to Local').cyan +
                (': [' + pathVal + ']').grey);
            deferred.resolve(data);
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
