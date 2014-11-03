/**
#convention
:Rule
.name: string 
.from: RegExp << /^\//
.to  : string
.isRemoteMap: boolean <! false
/convention

#convention
:Remote
.from: string
.to  : string
/convention

@exports: function(rules, options){
    rules  : Array<Rule> | undefined | null
    options: Object 
           .request >> ./request >> @exports.parse >> options
           .response >> ./response >> @exports.wrap >> options
           .remotes : Array<Remote>
           .after   : function(req, res){
               req: http.IncomingMessage
               res: http.ClientRequest
           }
           .error   : function(req, res){ 
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

module.exports = (function(http, merge, Promise, nw, fs, request, response, try2do, log){
    
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
                    from : /^\//
                }, rule);
            });
            
            options = merge.recursive({
                remotes: [],
                after  : function(req, res){ },
                error  : function(req, res){ }
            }, options);
            
            /** unconfigurable **/
            rules.forEach(function(rule, i){
                merge.recursive(rule, {
                    isRemoteMap: false
                });
            });
        }());
        
        
        return function(req, res){
            var reqPars = request.parse(req, options.request),
                resWrap = response.wrap(res);
            
            function err(){
                try2do(options.error.bind(options, req, res));
                resWrap.end();
            }
            
            function nxt(){
                try2do(options.after.bind(options, req, res), 
                       options.error.bind(options, req, res));
            }
            
            var matchedRule  = null;
            // 找到匹配的规则，后者优先
            rules.forEach(function(rule){
                if(rule.from.test(reqPars.dirname)){
                    matchedRule = rule;
                }
            });
            
            var rq = null, promises = [];
            if(!matchedRule){
                // 直接将请求转发到远端并返回
                nw.get(reqPars.toString()).then(function(rs){
                    
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
                                
                                nw.get(reqPars.toString(filename)).then(function(rs){
                                    
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
                });
            }
            
        };
    };
}(require('http'), require('merge'), require('promise'), 
  require('./nw'), require('./fs'), require('./request'), require('./response'), require('./try2do'), require('./log')));