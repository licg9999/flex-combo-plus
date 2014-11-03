/**
@exports: Object
        .get: function(url){
            url    : string
            @return: Promise
        }
**/
module.exports = (function(http, Promise){
    
    return {
        get: function(url){
            return new Promise(function(resolve, reject){
                
                http.get(url, function(res){
                    
                    resolve(res);
                    
                }).on('error', function(e){
                    
                    reject(e);
                });
            });
        }
    };
}(require('http'), require('promise')));
