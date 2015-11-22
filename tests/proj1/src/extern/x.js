var m = require('./_m');

module.exports = function(str){
    return m(str.split('').reduce(function(memo, c){
        return memo + c + ' ';
    }, ' '));
};
