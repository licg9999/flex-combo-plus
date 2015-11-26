/* jshint mocha:true */

/**
 * PS:
 * 1. sudo
 * 2. host binding: 127.0.0.1 g.alicdn.com
 * 3. network connected
 * 4. `gulp debug` before browserified tests
 */

var http = require('http');
var expect = require('chai').expect;
var request = require('request');

var glob = require('glob-all');
var async = require('async');
var fs = require('fs');
var convert = require('convert-source-map');

var instance = require('../');
var browserify = require('browserify');
var glob = require('glob-all');


var contents = {};
glob.sync([__dirname + '/src*/**/*.js', __dirname + '/src*/**/*.css', __dirname + '/proj*/build/**/*.js']).forEach(function(file) {
    var key = file.replace(__dirname + '/', '');
    var ctt = fs.readFileSync(file).toString();
    contents[key] = convert.removeComments(ctt);
});


describe('start http server', function() {
    it('should init without error', function(done) {
        http.createServer(instance([{
            name: '2src1',
            from: '/kissy/k/(\\d+\\.){2}\\d+/',
            to: __dirname + '/src1/',
            disabled: false
        }, {
            name: '2src2',
            from: '/kissy/d/(\\d+\\.){2}\\d+/',
            to: __dirname + '/src2/',
            disabled: false
        }, {
            name: '2proj1',
            from: '/kissy/b/(\\d+\\.){2}\\d+/',
            to: __dirname + '/proj1/src/',
            disabled: false
        }], {})).listen(80, done);
    });
});


function itL(url, files) {
    it('"' + url + '" <=> "' + files.join(' + ') + '"', function(done) {
        request(url, function(err, res, ctt) {
            if (err) throw err;
            done(err, expect(convert.removeComments(ctt)).to.equal(files.map(function(f) {
                return contents[f];
            }).join('')));
        });
    });
}

describe('plain', function() {

    function itRemote(path) {
        it('"http://g.alicdn.com' + path + '"', function(done) {
            async.parallel([
                function(cb) {
                    request('http://g.alicdn.com' + path, function(err, res, ctt) {
                        cb(err, ctt);
                    });
                },
                function(cb) {
                    request({
                        url: 'http://140.205.132.240' + path,
                        headers: {
                            host: 'g.alicdn.com'
                        }
                    }, function(err, res, ctt) {
                        cb(err, ctt);
                    });
                }
            ], function(err, results) {
                if (err) throw err;
                done(err, expect(results[0]).to.equal(results[1]));
            });
        });
    }

    describe('local files', function() {
        describe('in on directory', function() {
            itL('http://g.alicdn.com/kissy/k/1.4.14/a.js', ['src1/a.js']);

            itL('http://g.alicdn.com/kissy/k/1.4.14/??a.js,b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14/??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14/??/a.js,b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14/??a.js,/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14??a.js,b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14??a.js,/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14??/a.js,b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);

            itL('http://g.alicdn.com/kissy/k/??1.4.14/a.js,1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/??/1.4.14/a.js,1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k??1.4.14/a.js,1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k??/1.4.14/a.js,/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/??k/1.4.14/a.js,k/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);

            itL('http://g.alicdn.com/kissy??/k/1.4.14/a.js,/k/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/??kissy/k/1.4.14/a.js,kissy/k/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com??/kissy/k/1.4.14/a.js,/kissy/k/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);

            itL('http://g.alicdn.com/kissy/k/1.4.14/??a.js,b.js?t=' + Date.now(), ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k//1.4.14/??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kissy/k/../k/1.4.14/??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kimi/../kissy/k/../k//.//1.4.14/??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);
            itL('http://g.alicdn.com/kimi/../kissy/k/../k//.//1.4.14/??a.js,/b.js??t=' + Date.now(), ['src1/a.js', 'src1/b.js']);

            itL('http://g.alicdn.com/kissy/k/1.4.14/??a.js,d/x.js', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/d/x.js', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/kissy/k/??1.4.14/a.js,1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/kissy/k??/1.4.14/a.js,/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/kissy/??k/1.4.14/a.js,k/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/kissy??/k/1.4.14/a.js,/k/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/??kissy/k/1.4.14/a.js,kissy/k/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com??/kissy/k/1.4.14/a.js,/kissy/k/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);

            itL('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/d/../d/x.js', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/d/../d/x.js?t=' + Date.now(), ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/d/../d/x.js?t=' + Date.now() + '&debug=true', ['src1/a.js', 'src1/d/x.js']);
            itL('http://g.alicdn.com/kissy/../kissy/d/../k/1.4.14??/a.js,/r/../d/x.js???.t=' + Date.now() + '&-debug=true', ['src1/a.js', 'src1/d/x.js']);

        });

        describe('in different directories', function() {
            itL('http://g.alicdn.com/kissy/??k/1.4.14/a.js,d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
            itL('http://g.alicdn.com/kissy??k/1.4.14/a.js,d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
            itL('http://g.alicdn.com/kissy??/k/1.4.14/a.js,/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
            itL('http://g.alicdn.com/kissy/??/k/1.4.14/a.js,/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);

            itL('http://g.alicdn.com/??kissy/k/1.4.14/a.js,kissy/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
            itL('http://g.alicdn.com??kissy/k/1.4.14/a.js,kissy/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
            itL('http://g.alicdn.com??/kissy/k/1.4.14/a.js,/kissy/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
            itL('http://g.alicdn.com/??/kissy/k/1.4.14/a.js,/kissy/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
        });
    });

    describe('remote files', function() {
        this.timeout(5000);

        itRemote('/tb-mod/??tb-pad/1.0.1/index.css,tb-sitenav/1.0.3/index.css,tb-sysinfo/1.0.0/index.css,tb-sysbanner/1.0.0/index.css,tb-double12-banner/0.0.9/index.css,tb-banner/1.0.12/index.css,tb-top-spy/1.0.4/index.css,tb-birthday/1.0.2/index.css,tb-search/1.0.29/index.css,tb-logo/1.0.5/index.css,tb-qr/1.0.0/index.css,tb-nav/1.0.7/index.css,tb-tanx/1.0.0/index.css,tb-promo/1.0.7/index.css,tb-tmall/1.0.9/index.css,tb-notice/1.0.4/index.css,tb-member/1.0.7/index.css,tb-headlines/1.0.3/index.css,tb-conve/1.0.16/index.css,tb-double12-service/0.0.5/index.css,tb-double12-belt/0.0.3/index.css,tb-belt/1.0.5/index.css,tb-belt-slide/1.0.10/index.css,tb-apps/1.0.8/index.css,tb-feature/1.0.4/index.css,tb-discover-goods/1.0.3/index.css,tb-footprint/1.0.7/index.css,tb-discover-shop/1.0.3/index.css,tb-custom/1.0.0/index.css,tb-sale/1.0.0/index.css,tb-helper/1.0.0/index.css,tb-footer/1.0.0/index.css,tb-decorations/1.0.27/index.css,tb-fixedtool/1.0.0/index.css,tb-inject/0.0.13/index.css,tb-service/1.0.12/index.css,tb-cat/1.0.2/index.css,tb-rmdimg/1.0.0/index.css,tb-market-ifashion/1.0.7/index.css,tb-market/1.0.2/index.css,tb-market2/1.0.3/index.css,tb-market-electronic/1.0.4/index.css,tb-market-diet/1.0.8/index.css,tb-oead/1.0.0/index.css,tb-market-furniture/1.0.5/index.css,tb-market-pannel/1.0.4/index.css,tb-channel/1.0.1/index.css,tb-channel-travel/1.0.1/index.css,tb-guang/1.0.1/index.css,tb-channel2/1.0.3/index.css');

        itRemote('/??kissy/k/1.4.14/seed-min.js,tb/global/3.5.28/global-min.js');

        itRemote('/kissy/k/1.4.14/??xtemplate-min.js,xtemplate/runtime-min.js,xtemplate/compiler-min.js');
    });


    describe('remote & local files', function() {
        this.timeout(5000);

        it('http://g.alicdn.com/kissy/k/1.4.14/??seed-min.js,combobox-min.js', function(done) {
            async.parallel([
                function(cb) {
                    request('http://g.alicdn.com/kissy/k/1.4.14/??seed-min.js,combobox-min.js', function(err, res, ctt) {
                        cb(err, ctt);
                    });
                },
                function(cb) {
                    request({
                        url: 'http://140.205.132.240/kissy/k/1.4.14/??seed-min.js,combobox-min.js',
                        headers: {
                            host: 'g.alicdn.com'
                        }
                    }, function(err, res, ctt) {
                        cb(err, ctt);
                    });
                }
            ], function(err, results) {
                if (err) throw err;
                done(err, expect(results[0]).to.equal(results[1]));
            });
        });

        it('http://g.alicdn.com??kissy/k/1.4.14/a.js,tb/global/3.5.28/global-min.js', function(done) {
            async.parallel([
                function(cb) {
                    request('http://g.alicdn.com??kissy/k/1.4.14/a.js,tb/global/3.5.28/global-min.js', function(err, res, ctt) {
                        cb(err, ctt);
                    });
                },
                function(cb) {
                    fs.readFile(__dirname + '/src1/a.js', function(err, buf) {
                        cb(err, buf);
                    });
                },
                function(cb) {
                    request({
                        url: 'http://140.205.132.240/tb/global/3.5.28/global-min.js',
                        headers: {
                            host: 'g.alicdn.com'
                        }
                    }, function(err, res, ctt) {
                        cb(err, ctt);
                    });
                }
            ], function(err, results) {
                if (err) throw err;
                done(err, expect(results[0]).to.equal(results[1] + results[2]));
            });
        });
    });
});

describe('browserified', function() {
    this.timeout(5000);

    describe('local files', function() {
        itL('http://g.alicdn.com/kissy/b/1.4.14/a.js', ['proj1/build/a.js']);
        itL('http://g.alicdn.com/kissy/b/1.4.14/b.js', ['proj1/build/b.js']);
        itL('http://g.alicdn.com/kissy/b/1.4.14/c.js', ['proj1/build/c.js']);
        itL('http://g.alicdn.com/kissy/b/1.4.14/d.js', ['proj1/build/d.js']);
        itL('http://g.alicdn.com/kissy/b/1.4.14/??a.js,b.js,c.js,d.js', ['proj1/build/a.js', 'proj1/build/b.js', 'proj1/build/c.js', 'proj1/build/d.js']);
        itL('http://g.alicdn.com/kissy/b/1.4.14/gulpfile.js', ['proj1/build/gulpfile.js']);

        it('"http://g.alicdn.com/kissy/b/1.4.14/_n.js" should not be found', function(done) {
            request('http://g.alicdn.com/kissy/b/1.4.14/_n.js', function(err, res, ctt) {
                expect(res.statusCode).to.equal(406);
                done();
            });
        });

        it('"http://g.alicdn.com/kissy/b/1.4.14/none.js" should not exists locally', function(done) {
            request('http://g.alicdn.com/kissy/b/1.4.14/none.js', function(err, res, ctt) {
                expect(res.statusCode).to.equal(404);
                done();
            });
        });
    });
});
