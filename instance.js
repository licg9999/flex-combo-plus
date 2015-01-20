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

module.exports = (function(http, util, merge, Promise, colors,
                           nw, fs, request, requestFopts, 
                           response, responseFopts, try2do){
    
    return function(rules, options){
        (function format(){
            if(!options){ options = {}; }
            
            /** options **/
            options = merge.recursive({
                after  : function(req, res){ },
                error  : function(req, res){
                    res.writeHead(500, {'Content-Type': 'text/html'});
                    res.end('<h1 style="color: #900">Error 500</h1>');
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
            
            function err(){
                try2do(options.error.bind(options, req, res));
                resWrap.end();
            }
            
            function nex(){
                try2do(options.after.bind(options, req, res), 
                       options.error.bind(options, req, res));
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
                            fs.exists(toPath).then(function(isLocal){

                                if(isLocal){

                                    fs.readFile(toPath).then(function(chunk){

                                        resolve({
                                            isLocal: true,
                                            statusCode: 200,
                                            headers: {}, // TODO calculate headers
                                            chunk: chunk
                                        });
                                    }, reject);

                                }else {
                                    var bufs = [];
                                    nw.get(reqPars.toString([filenameIndex]), options.request).then(function(rs){

                                        rs.on('data', function(chunk){
                                            bufs.push(chunk);
                                        });

                                        rs.on('end', function(){
                                            resolve({
                                                isLocal: false,
                                                statusCode: rs.statusCode,
                                                headers: rs.headers,
                                                chunk  : Buffer.concat(bufs)
                                            });
                                        });

                                    }, reject);
                                }
                            });
                        }));
                    }else {
                        promises.push(new Promise(function(resolve, reject){

                            var bufs = [];
                            nw.get(reqPars.toString([filenameIndex]), options.request).then(function(rs){

                                rs.on('data', function(chunk){
                                    bufs.push(chunk);
                                });

                                rs.on('end', function(){
                                    resolve({
                                        isLocal: false,
                                        statusCode: rs.statusCode,
                                        headers: rs.headers,
                                        chunk  : Buffer.concat(bufs)
                                    });
                                });

                            }, reject);
                        }));
                    }
                });

                Promise.all(promises).done(function(hbufs){

                    var index = -1;
                    hbufs.forEach(function(hbuf, i){
                        if(hbuf.statusCode >= 400){
                            index = i;
                        }
                    });

                    if(index >= 0){
                        resWrap.writeHead(hbufs[index].statusCode, hbufs[index].headers);
                        resWrap.write(hbufs[index].chunk);
                        resWrap.end();

                    }else {

                        // TODO calculate headers
                        // 网络请求中的头部信息优先，其次是本地代理计算的头部信息
                        // 不论从时序、顺序，都是后者优先
                        hbufs.forEach(function(hbuf){
                            resWrap.write(hbuf.chunk);
                        });

                        resWrap.end();
                    }

                }, function(es){
                    err();
                });
            }else {
                // 直接将当前请求转发到远端并返回
                nw.get(reqPars.toString(), options.request).then(function(rs){
                    resWrap.writeHead(rs.statusCode, rs.headers);

                    rs.on('data', function(chunk){
                        resWrap.write(chunk);
                    });

                    rs.on('end', function(){
                        resWrap.end();
                    });

                }, function(e){
                    err();
                });
            }

        };
    };
}(require('http'), require('util'), require('merge'), require('promise'), require('colors'),
  require('./nw'), require('./fs'), require('./request'), require('./request.fopts'), 
  require('./response'), require('./response.fopts'), require('./try2do')));
