/**
#convention
:Rule
.name  : string 
.from  : RegExp << /^\//
.to    : string
.disabled: boolean << false
.remote  : boolean <! false
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

module.exports = (function(http, util, merge, Promise, 
                           nw, fs, request, requestFopts, 
                           response, responseFopts, try2do, log){
    
    return function(rules, options){
        (function format(){
            if(!rules){ 
                rules = []; 
            }
            
            if(!options){
                options = {}; 
            }
            
            /** configurable **/
            rules.forEach(function(rule, i){
                rules[i] = merge.recursive({
                    from    : /^\//,
                    disabled: false
                }, rule);
            });
            
            options = merge.recursive({
                after  : function(req, res){ },
                error  : function(req, res){
                    res.writeHead(500, {'Content-Type': 'text/html'});
                    res.end('<h1 color="#900">Error 500</h1>');
                }
            }, options);
            
            
            /** unconfigurable **/
            rules.forEach(function(rule, i){
                merge.recursive(rule, {
                    remote: false
                });
                
                if(!util.isRegExp(rule.from)){
                    rule.from = new RegExp(rule.from);
                }
            });
            
            
            /** sub-options **/
            options.request  = requestFopts(options.request);
            options.response = responseFopts(options.response);
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
            
            // 找到匹配的规则，前者优先
            var matchedRule = (function(){
                var i, n, rule,
                    dirpars, dirname, filepre;
                
                for(i = 0, n = rules.length; i < n; i++){
                    rule = rules[i];
                    if(!rule.disabled && rule.from.test(reqPars.dirname)){
                        
                        dirpars = reqPars.dirname.split(options.request.combo.dir);
                        dirname = options.request.combo.dir;
                        filepre = '';
                        
                        while(!dirpars[0]){ dirpars.shift(); }
                        
                        while(!dirpars[dirpars.length - 1]){ dirpars.pop(); }
                        
                        for(i = 0, n = dirpars.length - 1; i < n; i++){
                            dirname += dirpars[i] + options.request.combo.dir;
                            if(rule.from.test(dirname)){


                                i = i + 1;
                                n = dirpars.length;
                                while(i < n){
                                    filepre += dirpars[i] + options.request.combo.dir;
                                    i++;
                                }

                                reqPars.dirname = dirname;
                                for(i = 0, n = reqPars.filenames.length; i < n; i++){
                                    reqPars.filenames[i] = filepre + reqPars.filenames[i];
                                }

                                return rule;
                            }
                        }
                        
                        return rule;
                    }
                }
                return null;
            }());
            
            var rq = null, promises = [];
            if(!matchedRule){
                // 直接将请求转发到远端并返回
                nw.get(reqPars.toString(), options.request).then(function(rs){
                    
                    rs.on('data', function(chunk){
                        resWrap.write(chunk);
                    });
                    
                    rs.on('end', function(){
                        resWrap.end();
                    });
                    
                }, function(e){
                    err();
                });
            }else{
                
                // 组装文件名字列表，分别匹配以决定是将请求本地处理还是转发到远端，组装后再一起返回
                reqPars.filenames.forEach(function(filename, i){
                    var toPath = matchedRule.to  + filename;
                    
                    promises.push(new Promise(function(resolve, reject){
                        
                        fs.exists(toPath).then(function(isLocal){
                            
                            var bufs = [];
                            if(!isLocal){
                                
                                nw.get(reqPars.toString([filename]), options.request).then(function(rs){
                                    
                                    rs.on('data', function(chunk){
                                        bufs.push(chunk);
                                    });
                                    
                                    rs.on('end', function(chunk){
                                        resolve(Buffer.concat(bufs));
                                    });
                                }, reject);
                                
                            }else{
                                
                                fs.readFile(toPath).then(function(chunk){
                                    
                                    resolve(chunk);
                                    
                                }, reject);
                            }
                        });
                    }));
                });
                
                
                Promise.all(promises).done(function(bufs){
                    
                    bufs.forEach(function(buf){
                        
                        resWrap.write(buf);
                    });
                    resWrap.end();
                    
                }, function(es){
                    err();
                });
            }
            
        };
    };
}(require('http'), require('util'), require('merge'), require('promise'), 
  require('./nw'), require('./fs'), require('./request'), require('./request.fopts'), 
  require('./response'), require('./response.fopts'), require('./try2do'), require('./log')));