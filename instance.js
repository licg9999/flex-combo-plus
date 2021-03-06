/**
#convention
:Rule
.name  : string 
.from  : RegExp << /^\//
.to    : string
.disabled: boolean << false
/convention


@exports: function(rules, options){
    rules  : Array<Rule> | undefined | null
    options: Object 
           .request >> ./request.fopts >> @exports >> options
           .response >> ./response.fopts >> @exports >> options
           .after: function(req, res){
               req: http.IncomingMessage
               res: http.ClientRequest
           }
           .error: function(req, res){ 
               req: http.IncomingMessage
               res: http.ClientRequest
           } 
           | undefined | null
           
    @return: function(req, res){
        req: http.IncomingMessage
        res: http.ClientRequest
    }
}
**/
require('colors');
var http = require('http');
var util = require('util');
var merge = require('merge');
var DateUtils = require('date-utils');
var mime = require('mime');
var log = require('./log');
var nw = require('./nw');
var fs = require('./fs');
var request = require('./request');
var requestFopts = require('./request.fopts');
var response = require('./response');
var responseFopts = require('./response.fopts');
var try2do = require('./try2do');

module.exports = function(rules, options){
    (function format(){
        if(!options){ options = {}; }
        
        /** options **/
        options = merge.recursive({
            after  : function(req, res){
                res.end();
            },
            error  : function(req, res){
                res.writeHead(406, {'Content-Type': 'application/json'});
                res.write('{"message":"NotAcceptable, check the console for more infomation."}');
            }
        }, options);
        
        /** sub-options **/
        options.request  = requestFopts(options.request);
        options.response = responseFopts(options.response);
        
        
        if(!rules){ rules = []; }
        
        /** configurable **/
        rules.forEach(function(rule, i){
            rules[i] = merge.recursive({
                from    : /^\//,
                disabled: false
            }, rule);
        });
        
        /** unconfigurable **/
        rules.forEach(function(rule, i){
            if(!util.isRegExp(rule.from)){
                rule.from = new RegExp(rule.from);
            }
        });
    }());

    
    return function(req, res){
        var reqPars = request.parse(req, options.request),
            resWrap = response.wrap(res);

        function nex(){
            try2do(options.after.bind(options, req, res));
        }
        
        function err(e){
            e && log(e);
            try2do(options.error.bind(options, req, res));
            nex();
        }


        var hasMatched = false;
        reqPars.filenames.forEach(function(filename, filenameIndex){
            if(hasMatched){
                return;
            }

            var i, n, rule;
            for(i = 0, n = rules.length; i < n; i++){

                rule = rules[i];
                if(rule.disabled){
                    continue;
                }

                if(rule.from.test(reqPars.resolveDirname(filenameIndex))){
                    hasMatched = true;
                }
            }
        });

        if(hasMatched){
            var promises = [];
            reqPars.filenames.forEach(function(filename, filenameIndex){
                var i, n, rule, 
                    toPath, dirname, dirpars, filepre;
                for(i = 0, n = rules.length; i < n; i++){
                    rule = rules[i];
                    if(rule.disabled){
                        continue;
                    }

                    dirname = reqPars.resolveDirname(filenameIndex);
                    if(rule.from.test(dirname)){
                        toPath  = rule.to;
                        dirpars = dirname.split(options.request.combo.dir);
                        while(!dirpars[0]){ dirpars.shift(); }
                        while(!dirpars[dirpars.length - 1]){ dirpars.pop(); }
                            
                        dirname = options.request.combo.dir;
                        filepre = ''; 
                        for(i = 0, n = dirpars.length; i < n; i++){
                            dirname += dirpars[i] + options.request.combo.dir;

                            if(rule.from.test(dirname)){
                                i = i + 1;
                                n = dirpars.length;
                                while(i < n){ 
                                    filepre += dirpars[i] + options.request.combo.dir;
                                    i++;
                                }   

                                toPath += filepre + reqPars.resolveFilename(filenameIndex);
                                break;
                            }   
                        }   
                        break;
                    }
                }

                if(toPath){
                    promises.push(new Promise(function(resolve, reject){
                        fs.readFile(toPath).then(function(pair){
                            var contentType = mime.lookup(toPath);
                            var chunk = pair[0];
                            toPath = pair[1];

                            fs.stat(toPath).then(function(stats){
                                resolve({
                                    type: 0x1, // binary: 01
                                    statusCode: 200,
                                    headers: {
                                        'content-type'                : contentType,
                                        'content-length'              : chunk.length,
                                        'last-modified'               : stats.mtime.getTime(),
                                        'server'                      : 'aproxy',
                                        'access-control-allow-origin' : '*'
                                    },
                                    chunk: chunk
                                });

                                pair = null;
                                contentType = null;
                                chunk = null;
                            }, reject);

                        }, function(err){

                            if(err && err.code === 'ENOENT'){
                                nw.get(reqPars.toUrlPars([filenameIndex]), options.request).then(function(rs){
                                    var bufs = [];

                                    rs.on('data', function(chunk){
                                        bufs.push(chunk);
                                    });

                                    rs.on('end', function(){
                                        if(rs.headers['last-modified']){
                                            rs.headers['last-modified'] = Date.parse(rs.headers['last-modified']);
                                        }
                                        if(rs.headers['content-length']){
                                            rs.headers['content-length'] = +rs.headers['content-length'];
                                        }
                                        resolve({
                                            type: 0x3, // binary: 11
                                            statusCode: rs.statusCode,
                                            headers: rs.headers,
                                            chunk  : Buffer.concat(bufs)
                                        });
                                    });
                                }, reject);
                            }else {
                                reject(err);
                            }
                        });
                    }));
                }else {
                    promises.push(new Promise(function(resolve, reject){

                        nw.get(reqPars.toUrlPars([filenameIndex]), options.request).then(function(rs){
                            var bufs = [];

                            rs.on('data', function(chunk){
                                bufs.push(chunk);
                            });

                            rs.on('end', function(){
                                if(rs.headers['last-modified']){
                                    rs.headers['last-modified'] = Date.parse(rs.headers['last-modified']);
                                }
                                if(rs.headers['content-length']){
                                    rs.headers['content-length'] = +rs.headers['content-length'];
                                }
                                resolve({
                                    type: 0x2, // binary: 10
                                    statusCode: rs.statusCode,
                                    headers: rs.headers,
                                    chunk  : Buffer.concat(bufs)
                                });
                            });

                        }, reject);
                    }));
                }
            });

            Promise.all(promises).then(function(hbufs){
                /**
                 * hbuf.type 的二进制个位表示是否匹配，十位表示是否用网络获取的数据
                 **/

                var errorIndex = -1;
                hbufs.forEach(function(hbuf, i){
                    if(errorIndex >= 0){
                        return;
                    }
                    if(hbuf.statusCode >= 400){
                        errorIndex = i;
                    }
                });

                if(errorIndex >= 0){
                    // 存在错误时，直接返回那条错误页
                    resWrap.writeHead(hbufs[errorIndex].statusCode, hbufs[errorIndex].headers);
                    resWrap.write(hbufs[errorIndex].chunk);
                    nex();

                }else {

                    // 没有错误时，计算出头部信息，状态码至200，返回全部数据
                    var ohbuf = {
                        type: 0x0, // 00
                        statusCode: 200,
                        headers: {
                            'connection': 'keep-alive',
                            'content-length': 0,
                            'last-modified': undefined,
                            'content-type': '',
                            'server': '',
                            'access-control-allow-origin': '*'
                        }
                    };
                    /**
                     * 头部信息计算概述：
                     * 内容长度累加
                     * 新者优先于老者
                     * 远端优先于本地
                     * 后者优先于前者
                     **/
                    hbufs.forEach(function(hbuf){
                        if(typeof ohbuf.headers['content-length'] !== 'undefined'){
                            if(typeof hbuf.headers['content-length'] !== 'undefined'){
                                ohbuf.headers['content-length'] = ohbuf.headers['content-length'] +  hbuf.headers['content-length'];
                            }else {
                                delete ohbuf.headers['content-length'];
                            }
                        }

                        if(typeof hbuf.headers['last-modified'] !== 'undefined'){
                            if(typeof ohbuf.headers['last-modified'] === 'undefined'){
                                ohbuf.headers['last-modified'] = hbuf.headers['last-modified'];
                            }else if(ohbuf.headers['last-modified'] < hbuf.headers['last-modified']){
                                ohbuf.headers['last-modified'] = hbuf.headers['last-modified'];
                            }
                        }

                        if((hbuf.type & 0x2) >> 1 || !((ohbuf.type & 0x2) >> 1)){
                            ohbuf.type = hbuf.type;
                            if(typeof hbuf.headers['content-type'] !== 'undefined'){
                                ohbuf.headers['content-type'] = hbuf.headers['content-type'];
                            }
                            if(typeof hbuf.headers['server'] !== 'undefined'){
                                ohbuf.headers['server'] = hbuf.headers['server'];
                            }
                            if(typeof hbuf.headers['access-control-allow-origin'] !== 'undefined'){
                                ohbuf.headers['access-control-allow-origin'] = hbuf.headers['access-control-allow-origin'];
                            }
                        }
                    });

                    if(typeof ohbuf.headers['content-length'] !== 'undefined'){
                        ohbuf.headers['content-length'] = +ohbuf.headers['content-length']; 
                    }

                    if(typeof ohbuf.headers['last-modified'] !== 'undefined'){
                        var date = new Date();
                        date.setTime(ohbuf.headers['last-modified']);
                        ohbuf.headers['last-modified'] = date.toUTCFormat('DDD, DD MMM YYYY HH24:MI:SS ') + 'GMT';
                    }

                    resWrap.writeHead(ohbuf.statusCode, ohbuf.headers);
                    hbufs.forEach(function(hbuf){
                        resWrap.write(hbuf.chunk);
                    });
                    nex();
                }

            }, function(e){
                err(e);
            });
        }else {
            // 直接将当前请求转发到远端并返回
            nw.get(reqPars.toUrlPars(), options.request).then(function(rs){
                resWrap.writeHead(rs.statusCode, rs.headers);

                rs.on('data', function(chunk){
                    resWrap.write(chunk);
                });

                rs.on('end', function(){
                    nex();
                });

            }, function(e){
                err(e);
            });
        }

    };
};
