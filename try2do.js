function try2do(foo, onError){
    try{
        foo();
    }catch(e){
        if(typeof onError === 'function'){
            try2do(onError);
        }
    }
}
module.exports = try2do;
