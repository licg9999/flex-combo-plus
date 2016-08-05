/* jshint mocha:true */

var http = require('http');
var instance = require('../');
var itA = require('./_common').itA;


describe('plain', function(){
    this.timeout(5000);

    var server;
    describe('start http server', function() {
        it('should init without error', function(done) {
            server = http.createServer(instance([{
                name: '2src3',
                from: '/kissy/k/(\\d+\\.){2}\\d+/',
                to: __dirname + '/src3/',
                disabled: false
            }], {})).listen(80, done);
        });
    });

    describe('local files', function() {
        itA('http://g.alicdn.com/kissy/k/1.4.14/a.css', ['src3/a.css']);
        itA('http://g.alicdn.com/kissy/k/1.4.14/??a.css,b.css', ['src3/a.css', 'src3/b.css']);

        itA('http://g.alicdn.com/??tb-mod/tb-pad/1.0.1/index.css,kissy/k/1.4.14/a.css', [
            'http://g.alicdn.com/??tb-mod/tb-pad/1.0.1/index.css',
            'src3/a.css'
        ]);
    });

    describe('stop http server', function(){
        it('should shutdown without error', function(done){
            server.close(done);
        });
    });
});
