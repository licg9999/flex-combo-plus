/**
@exports: Object
        .get: function(urlPars, options){
            urlStr : URL
            options >> ./request.fopts >> @exports >> options
            @return: Promise
        }
        .head: function(urlPars, options){
            urlStr : URL
            options >> ./request.fopts >> @exports >> options
            @return: Promise
        }
**/
module.exports = (function(http, url, dns, colors, log){

    function request(urlPars, options, actions){
        actions = actions || {};
        var before  = actions.before || function(){},
            after   = actions.after  || function(){},
            error   = actions.error  || function(){};

        var deferred = Promise.defer();

        function next(){
            before({});

            http.get(urlPars, function(res){
                after();
                deferred.resolve(res);

            }).on('error', function(e){

                error(e);
                deferred.reject(('Unreachable Remote(' + urlPars.headers.host + ')').red +
                       (': [' + url.format(urlPars) + ']').grey);
            });
        }

        if(urlPars.headers.host.match(/(\d{1,3}\.){3}\d{1,3}/)){
            error(null);
            deferred.reject('Bad request'.red +
                  (': [' + url.format(urlPars) + ']').grey);
        }else {
            if(options.remote[urlPars.headers.host]){
                next();
            }else {
                dns.lookup(urlPars.headers.host, function(err, addr){
                    if(!err && addr !== '127.0.0.1'){
                        next();
                    }else {
                        error(null);
                        deferred.reject(('Unconfigured Remote(' + urlPars.headers.host + ')').red +
                               (': [' + url.format(urlPars) + ']').grey);
                    }
                });
            }
        }

        return deferred.promise;
    }
    
    return {
        get: function(urlPars, options){

            return request(urlPars, options, {
                before: function(){
                    urlPars.method = 'GET';
                },

                after: function(){
                    log(('Dispatched to Remote(' + urlPars.headers.host + ')').magenta +
                        (': [' + url.format(urlPars) + ']').grey);
                }
            });
        },

        head: function(urlPars, options){

            return request(urlPars, options, {

                before: function(){
                    urlPars.method = 'HEAD';
                }
            });
        }
    };
}(require('http'), require('url'), require('dns'), require('colors'), require('./log')));
