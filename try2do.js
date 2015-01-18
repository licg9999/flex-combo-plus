/**
@exports: function(foo, args, err){
    foo: function(){}
    err: function(e){ e: Error } | undefined | null
}
**/
module.exports = (function(){
    return function try2do(foo, err){
        try{
            foo();
        }catch(e){
            if(err){
                try2do(err);
            }
        }
    };
}());
