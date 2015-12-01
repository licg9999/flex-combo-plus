/* jshint mocha:true */

var expect = require('chai').expect;

var fs = require('fs');
var path = require('path');
var request = require('request');
var async = require('async');
var convert = require('convert-source-map');

var http = require('http');
var instance = require('../');

var common = require('./_common');

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

function itM(url, sources){
    it(url + '  <=>  ' + sources.join().replace(/build/g, 'src').replace('.css', '.less'), function(done){
        var missions = [
            function(cb){ 
                request(url, function(err, res, ctt){
                    cb(err, ctt);
                }); 
            },
        ];

        sources.forEach(function(source){
            if(source.indexOf('http://') === 0){
                missions.push(function(cb){
                    request({
                        url: source.replace('g.alicdn.com', '140.205.132.240'),
                        headers: {
                            host: 'g.alicdn.com'
                        }
                    }, function(err, res, ctt){
                        cb(err, ctt);
                    });
                });
            }else {
                missions.push(function(cb){
                    fs.readFile(__dirname + path.sep + source, function(err, buf){
                        cb(err, buf.toString());
                    });
                });
            }
        });

        async.parallel(missions, function(err, results){
            expect(err).to.not.exist;
            var proxyResult = convert.removeComments(results.shift());

            var expectedResult = results.map(function(lr){
                return convert.removeComments(lr);
            }).join('');

            expect(proxyResult).to.equal(expectedResult);
            done();
        });
    });
}

describe('local files', function(){
    //itM('http://g.alicdn.com/kissy/k/1.4.14/a.js' , ['proj2/build/a.js']);
    //itM('http://g.alicdn.com/kissy/k/1.4.14/a.css', ['proj2/build/a.css']);
    //itM('http://g.alicdn.com/kissy/k/1.4.14/b.js' , ['proj2/build/b.js']);
    //itM('http://g.alicdn.com/kissy/k/1.4.14/b.css', ['proj2/build/b.css']);
    //itM('http://g.alicdn.com/kissy/k/1.4.14/??a.js,b.js'  , ['proj2/build/a.js', 'proj2/build/b.js']);
    //itM('http://g.alicdn.com/kissy/k/1.4.14/??a.css,b.css', ['proj2/build/a.css', 'proj2/build/b.css']);
    itM('http://g.alicdn.com/kissy/k/1.4.14/c.css', ['proj2/build/c.css']);
});

describe('remote files', function(){
    //itM('http://g.alicdn.com/kissy/k/1.4.14/seed-min.js' , ['http://g.alicdn.com/kissy/k/1.4.14/seed-min.js']);
});

describe('local x remote', function(){
    //itM('http://g.alicdn.com/kissy/k/1.4.14/??a.js,seed-min.js' , [
        //'proj2/build/a.js',
        //'http://g.alicdn.com/kissy/k/1.4.14/seed-min.js'
    //]);
});
