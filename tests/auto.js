/* jshint mocha:true */

var expect = require('chai').expect;

var fs = require('fs');
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
            from: '/kissy/a/(\\d+\\.){2}\\d+/',
            to  : __dirname + '/proj2/src/',
            disabled: false
        }], {
        })).listen(80, done);
    });
});

function itLocal(url, path){
    it(url + '  <=>  ' + path.replace('build', 'src').replace('.css', '.less'), function(done){
        async.parallel([
            function(cb){
                request(url, cb);
            },
            function(cb){
                fs.readFile(path, cb);
            }
        ], function(err, results){
            expect(err).to.not.exist;
            expect(convert.removeComments(results[1].toString())).to.equal(convert.removeComments(results[0][1]));
            done();
        });
    });
}

describe('local files', function(){
    //itLocal('http://g.alicdn.com/kissy/a/1.0.0/a.js', __dirname + '/proj2/build/a.js');
    itLocal('http://g.alicdn.com/kissy/a/1.0.0/a.css', __dirname + '/proj2/build/a.css');
});
