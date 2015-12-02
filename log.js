/**
@exports: function(o){
    o: *
}
**/

var rSpaces = /^ */mg;
module.exports = function(o){
    console.log(typeof o === 'string'? o.replace(rSpaces, '  '): o);
};
