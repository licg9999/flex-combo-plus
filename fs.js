/**
@exports: Object
        .exists: function(){
            path   : string
            @return: Promise
        }
**/
module.exports = (function(fs, Promise){
    
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
                        resolve(data);
                    }
                });
            });
        }
    };
}(require('fs'), 
  require('promise')));