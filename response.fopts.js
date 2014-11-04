/**
@exports: function(options){
    options: Object | null | undefined
    @return >> options
}
**/
module.exports = (function(merge){
    
    return function(options){
        if(!options){
            options = {};
        }

        /** configurable **/
        options = merge.recursive({

        }, options);
        
        return options;
    };
}(require('merge')));