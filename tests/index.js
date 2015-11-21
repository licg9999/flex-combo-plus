/* jshint mocha:true */

var http = require('http');
var expect = require('chai').expect;
var request = require('request');

var glob = require('glob-all');
var async = require('async');
var fs = require('fs');

var instance = require('../');


var contents = {};
glob.sync([__dirname + '/src*/**/*.js', __dirname + 'src*/**/*.css']).forEach(function(file){
    contents[file.replace(__dirname + '/', '')] = fs.readFileSync(file).toString();
});


describe('start http server', function(){
    it('should init without error', function(done){
        http.createServer(instance([
            {
                name: '2src1',
                from: '/kissy/k/(\\d+\\.){2}\\d+/', 
                to  : __dirname + '/src1/',
                disabled: false
            }, {
                name: '2src2',
                from: '/kissy/d/(\\d+\\.){2}\\d+/',
                to  : __dirname + '/src2/',
                disabled: false
            }
        ], {
        })).listen(80, done);
    });
});

function itLocal(url, files){
    it('"' + url + '" <=> "' + files.join(' + ') + '"', function(done){
        request(url, function(err, res, ctt){
            if(err) throw err;
            done(err, expect(ctt).to.equal(files.map(function(f){
                return contents[f];
            }).join('')));
        });
    });
}

describe('local files', function(){
    describe('in on directory', function(){
        itLocal('http://g.alicdn.com/kissy/k/1.4.14/a.js', ['src1/a.js']);

        itLocal('http://g.alicdn.com/kissy/k/1.4.14/??a.js,b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14/??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14/??/a.js,b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14/??a.js,/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14??a.js,b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14??a.js,/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14??/a.js,b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);

        itLocal('http://g.alicdn.com/kissy/k/??1.4.14/a.js,1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/??/1.4.14/a.js,1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k??1.4.14/a.js,1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k??/1.4.14/a.js,/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/??k/1.4.14/a.js,k/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);

        itLocal('http://g.alicdn.com/kissy??/k/1.4.14/a.js,/k/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/??kissy/k/1.4.14/a.js,kissy/k/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com??/kissy/k/1.4.14/a.js,/kissy/k/1.4.14/b.js', ['src1/a.js', 'src1/b.js']);

        itLocal('http://g.alicdn.com/kissy/k/1.4.14/??a.js,b.js?t=' + Date.now(), ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k//1.4.14/??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kissy/k/../k/1.4.14/??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kimi/../kissy/k/../k//.//1.4.14/??/a.js,/b.js', ['src1/a.js', 'src1/b.js']);
        itLocal('http://g.alicdn.com/kimi/../kissy/k/../k//.//1.4.14/??a.js,/b.js??t=' + Date.now(), ['src1/a.js', 'src1/b.js']);

        itLocal('http://g.alicdn.com/kissy/k/1.4.14/??a.js,d/x.js', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/d/x.js', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/kissy/k/??1.4.14/a.js,1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/kissy/k??/1.4.14/a.js,/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/kissy/??k/1.4.14/a.js,k/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/kissy??/k/1.4.14/a.js,/k/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/??kissy/k/1.4.14/a.js,kissy/k/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com??/kissy/k/1.4.14/a.js,/kissy/k/1.4.14/d/x.js', ['src1/a.js', 'src1/d/x.js']);

        itLocal('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/d/../d/x.js', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/d/../d/x.js?t=' + Date.now(), ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/kissy/k/1.4.14??/a.js,/d/../d/x.js?t=' + Date.now() + '&debug=true', ['src1/a.js', 'src1/d/x.js']);
        itLocal('http://g.alicdn.com/kissy/../kissy/d/../k/1.4.14??/a.js,/r/../d/x.js???.t=' + Date.now() + '&-debug=true', ['src1/a.js', 'src1/d/x.js']);

    });

    describe('in different directories', function(){
        itLocal('http://g.alicdn.com/kissy/??k/1.4.14/a.js,d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
        itLocal('http://g.alicdn.com/kissy??k/1.4.14/a.js,d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
        itLocal('http://g.alicdn.com/kissy??/k/1.4.14/a.js,/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
        itLocal('http://g.alicdn.com/kissy/??/k/1.4.14/a.js,/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);

        itLocal('http://g.alicdn.com/??kissy/k/1.4.14/a.js,kissy/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
        itLocal('http://g.alicdn.com??kissy/k/1.4.14/a.js,kissy/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
        itLocal('http://g.alicdn.com??/kissy/k/1.4.14/a.js,/kissy/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
        itLocal('http://g.alicdn.com/??/kissy/k/1.4.14/a.js,/kissy/d/1.4.14/b.js', ['src1/a.js', 'src2/b.js']);
    });
});

function itRemote(path){
    it('"http://g.alicdn.com' + path + '"', function(done){
        async.parallel([
            function(cb){
                request('http://g.alicdn.com' + path, function(err, res, ctt){
                    cb(err, ctt);
                });
            },
            function(cb){
                request({
                    url: 'http://140.205.132.240' + path,
                    headers: {
                        host: 'g.alicdn.com'
                    }
                }, function(err, res, ctt){
                    cb(err, ctt);
                });
            }
        ], function(err, results){
            if(err) throw err;
            done(err, expect(results[0]).to.equal(results[1]));
        });
    });
}

describe('remote files', function(){
    this.timeout(0);

    itRemote('/tb-mod/??tb-pad/1.0.1/index.css,tb-sitenav/1.0.3/index.css,tb-sysinfo/1.0.0/index.css,tb-sysbanner/1.0.0/index.css,tb-double12-banner/0.0.9/index.css,tb-banner/1.0.12/index.css,tb-top-spy/1.0.4/index.css,tb-birthday/1.0.2/index.css,tb-search/1.0.29/index.css,tb-logo/1.0.5/index.css,tb-qr/1.0.0/index.css,tb-nav/1.0.7/index.css,tb-tanx/1.0.0/index.css,tb-promo/1.0.7/index.css,tb-tmall/1.0.9/index.css,tb-notice/1.0.4/index.css,tb-member/1.0.7/index.css,tb-headlines/1.0.3/index.css,tb-conve/1.0.16/index.css,tb-double12-service/0.0.5/index.css,tb-double12-belt/0.0.3/index.css,tb-belt/1.0.5/index.css,tb-belt-slide/1.0.10/index.css,tb-apps/1.0.8/index.css,tb-feature/1.0.4/index.css,tb-discover-goods/1.0.3/index.css,tb-footprint/1.0.7/index.css,tb-discover-shop/1.0.3/index.css,tb-custom/1.0.0/index.css,tb-sale/1.0.0/index.css,tb-helper/1.0.0/index.css,tb-footer/1.0.0/index.css,tb-decorations/1.0.27/index.css,tb-fixedtool/1.0.0/index.css,tb-inject/0.0.13/index.css,tb-service/1.0.12/index.css,tb-cat/1.0.2/index.css,tb-rmdimg/1.0.0/index.css,tb-market-ifashion/1.0.7/index.css,tb-market/1.0.2/index.css,tb-market2/1.0.3/index.css,tb-market-electronic/1.0.4/index.css,tb-market-diet/1.0.8/index.css,tb-oead/1.0.0/index.css,tb-market-furniture/1.0.5/index.css,tb-market-pannel/1.0.4/index.css,tb-channel/1.0.1/index.css,tb-channel-travel/1.0.1/index.css,tb-guang/1.0.1/index.css,tb-channel2/1.0.3/index.css');

    itRemote('/??kissy/k/1.4.14/seed-min.js,tb/global/3.5.28/global-min.js');

    itRemote('/kissy/k/1.4.14/??xtemplate-min.js,xtemplate/runtime-min.js,xtemplate/compiler-min.js');
});


describe('remote & local files', function(){
    // TODO
});
