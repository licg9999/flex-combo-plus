/* jshint mocha:true */
var fs = require('fs');
var path = require('path');
var async = require('async');
var request = require('request');
var expect = require('chai').expect;
var preproc = require('../preproc');

module.exports = {
    itA: function(url, sources) {
        it(url + '  <=>  ' + sources.join().replace(/build/g, 'src'), function(done) {
            var missions = [
                function(cb) {
                    request(url, function(err, res, ctt) {
                        cb(err, ctt);
                    });
                },
            ];

            sources.forEach(function(source) {
                if (source.indexOf('http://') === 0) {
                    missions.push(function(cb) {
                        request({
                            url: source.replace('g.alicdn.com', '140.205.77.250'),
                            headers: {
                                host: 'g.alicdn.com'
                            }
                        }, function(err, res, ctt) {
                            cb(err, ctt);
                        });
                    });
                } else {
                    missions.push(function(cb) {
                        preproc(__dirname + path.sep + source)
                        .then(function(pair){
                            cb(null, pair[0].toString());
                        })
                        .catch(function(err){
                            cb(err);
                        });
                    });
                }
            });

            async.parallel(missions, function(err, results) {
                expect(err).to.not.exist;
                var proxyResult = results.shift();

                var expectedResult = results.map(function(lr) {
                    return lr;
                }).join('');

                expect(proxyResult).to.equal(expectedResult);
                done();
            });
        });
    },

    itP: function(url, sources){
    }
};
