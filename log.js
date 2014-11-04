/**
@exports: function(o){
    o: *
}
**/

module.exports = (function(){
    var rSpaces = /^ */mg;
    return function(o){
        console.log(o.replace(rSpaces, '  '));
    };
}());