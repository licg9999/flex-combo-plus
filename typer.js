module.exports = (function(){
    
    function isType(type){
        return function(o){
            return {}.toString.call(o) === '[object ' + type + ']';
        };
    }

    var typer = {
        isUndeinfed : isType('Undefined'),
        isNull      : isType('Null'),
        isBoolean   : isType('Boolean'),
        isNumber    : isType('Number'),
        isString    : isType('String'),
        isFunction  : isType('Function'),
        isObject    : isType('Object'),
        isArray     : isType('Array')
    };
    
    return typer;
}());