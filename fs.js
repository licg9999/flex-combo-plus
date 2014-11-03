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
        }
    };
}(require('fs'), 
  require('promise')));