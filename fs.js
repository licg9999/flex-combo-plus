/**
@exports: Object
        .exists: function(){
            path   : string
            @return: Promise
        }
**/
module.exports = (function(fs, Promise, log){
    
    return {
        exists: function(path){
            return new Promise(function(resolve){
                fs.exists(path, function(b){
                    resolve(b);
                });
            });
        },
        
        readFile: function(path){
            return new Promise(function(resolve, reject){
                fs.readFile(path, {}, function(err, data){
                    if(err){
                        reject();
                    }else{
                        log(('Disapathed to Local').cyan +
                            (': [' + path + ']').grey);
                        resolve(data);
                    }
                });
            });
        },

        stat: function(path){
            return new Promise(function(resolve, reject){
                fs.stat(path, function(err, stats){
                    if(err){
                        reject();
                    }else {
                        resolve(stats);
                    }
                });
            });
        }
    };
}(require('fs'), require('promise'), require('./log')));
