/**
@exports: Object
        .get: function(urlPars, options){
            urlPars :UrlPars
            options >> ./request.fopts >> @exports >> options
            @return: Promise
        }
        .head: function(urlPars, options){
            urlPars :UrlPars
            options >> ./request.fopts >> @exports >> options
            @return: Promise
        }
**/
require('colors');
var http = require('http');
var url  = require('url');
var dns  = require('dns');
var log  = require('./log');

function request(urlPars, options, actions) {
    return new Promise(function(resolve, reject) {
        actions = actions || {};
        var before = actions.before || function() {},
            after = actions.after || function() {},
            error = actions.error || function() {};

        function next() {
            before({});

            http.get(urlPars, function(res) {
                after();
                resolve(res);

            }).on('error', function(e) {

                error(e);
                reject(('Unreachable Remote(' + urlPars.headers.host + ')').red +
                    (': [' + url.format(urlPars) + ']').grey);
            });
        }

        if (urlPars.headers.host.match(/(\d{1,3}\.){3}\d{1,3}/)) {
            error(null);
            reject('Bad request'.red +
                (': [' + url.format(urlPars) + ']').grey);
        } else {
            if (options.remote[urlPars.headers.host]) {
                next();
            } else {
                dns.resolve4(urlPars.headers.host, function(err, addr) {
                    if(err || (addr = addr[0]) === '127.0.0.1'){
                        error(err);
                        reject(('Unconfigured Remote(' + urlPars.headers.host + ')').red +
                            (': [' + url.format(urlPars) + ']').grey);
                    }else {
                        urlPars.host = urlPars.host.replace(urlPars.hostname, addr);
                        urlPars.hostname = addr;
                        next();
                    }
                });
            }
        }
    });

}

module.exports = {
    get: function(urlPars, options) {

        return request(urlPars, options, {
            before: function() {
                urlPars.method = 'GET';
            },

            after: function() {
                log(('Dispatched to Remote(' + urlPars.headers.host + ')').magenta +
                    (': [' + url.format(urlPars) + ']').grey);
            }
        });
    },

    head: function(urlPars, options) {

        return request(urlPars, options, {

            before: function() {
                urlPars.method = 'HEAD';
            }
        });
    }
};
