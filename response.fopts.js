/**
@exports: function(options){
    options: Object | null | undefined
    @return >> options
}
**/
var merge = require('merge');
    
module.exports = function(options){
    if(!options){
        options = {};
    }

    /** configurable **/
    options = merge.recursive({

    }, options);
    
    return options;
};
