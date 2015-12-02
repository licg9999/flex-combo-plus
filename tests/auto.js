/* jshint mocha:true */
var http = require('http');
var instance = require('../');
var itA = require('./_common').itA;

describe('auto', function(){
    describe('start http server', function(){
        it('should init without error', function(done) {
            http.createServer(instance([{
                name: '2proj2',
                from: '/kissy/k/(\\d+\\.){2}\\d+/',
                to  : __dirname + '/proj2/src/',
                disabled: false
            }], {
            })).listen(80, done);
        });
    });


    describe('local files', function(){
        itA('http://g.alicdn.com/kissy/k/1.4.14/a.js' , ['proj2/build/a.js']);
        itA('http://g.alicdn.com/kissy/k/1.4.14/a.css', ['proj2/build/a.css']);
        itA('http://g.alicdn.com/kissy/k/1.4.14/b.js' , ['proj2/build/b.js']);
        itA('http://g.alicdn.com/kissy/k/1.4.14/b.css', ['proj2/build/b.css']);
        itA('http://g.alicdn.com/kissy/k/1.4.14/??a.js,b.js'  , ['proj2/build/a.js', 'proj2/build/b.js']);
        itA('http://g.alicdn.com/kissy/k/1.4.14/??a.css,b.css', ['proj2/build/a.css', 'proj2/build/b.css']);
    });

    describe('remote files', function(){
        itA('http://g.alicdn.com/kissy/k/1.4.14/seed-min.js' , ['http://g.alicdn.com/kissy/k/1.4.14/seed-min.js']);
    });

    describe('local x remote', function(){
        itA('http://g.alicdn.com/kissy/k/1.4.14/??a.js,seed-min.js' , [
            'proj2/build/a.js',
            'http://g.alicdn.com/kissy/k/1.4.14/seed-min.js'
        ]);
        itA('http://g.alicdn.com/kissy/k/1.4.14/??seed-min.js,a.js' , [
            'http://g.alicdn.com/kissy/k/1.4.14/seed-min.js',
            'proj2/build/a.js'
        ]);
    });
});
