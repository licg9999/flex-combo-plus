/**
@exports: Object
        .exists: function(){
            path   : string
            @return: Promise
        }
**/
module.exports = (function(fs, log){
    
    return {
        exists: function(path){
            var deferred = Promise.defer();
            fs.exists(path, function(b){
                deferred.resolve(b);
            });
            return deferred.promise;
        },
        
        readFile: function(path){
            var deferred = Promise.defer();
            fs.readFile(path, {}, function(err, data){
                if(err){
                    deferred.reject();
                }else{
                    log(('Disapathed to Local').cyan +
                        (': [' + path + ']').grey);
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        },

        stat: function(path){
            var deferred = Promise.defer();
            fs.stat(path, function(err, stats){
                if(err){
                    deferred.reject();
                }else {
                    deferred.resolve(stats);
                }
            });
            return deferred.promise;
        },

        browserifyFile: function(path){
            var deferred = Promise.defer();
            return deferred.promise;
        }
    };
}(require('fs'), require('./log')));
