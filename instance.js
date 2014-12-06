/**
#convention
:Rule
.name  : string 
.from  : RegExp << /^\//
.to    : string
.disabled: boolean << false

.gitlab: Object
       .url   : >> ./gitlab >> GitlabConfig.url
       .token : >> ./gitlab >> GitlabConfig.token
       .tag: Object
           .pre: string << 'publish'
           .mid: string << '/'
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
                           nw, fs, gitlab, request, requestFopts, 
                           response, responseFopts, try2do, log){
    
    return function(rules, options){
        (function format(){
            if(!options){ options = {}; }
            
            /** options **/
            options = merge.recursive({
                after  : function(req, res){ },
                error  : function(req, res){
                    res.writeHead(500, {'Content-Type': 'text/html'});
                    res.end('<h1 color="#900">Error 500</h1>');
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
                
                if(rules.gitlab){
                    rules[i].gitlab = merge.recursive({
                        tag: {
                            pre: 'publish',
                            mid: '/'
                        }
                    }, rules.gitlab);
                }
            });
            
            /** unconfigurable **/
            rules.forEach(function(rule, i){
                if(!util.isRegExp(rule.from)){
                    rule.from = new RegExp(rule.from);
                }
                
                if(rule.gitlab){
                    if(rule.gitlab.url.indexOf(options.request.protocal) !== 0){
                        rule.gitlab.url = options.request.protocal + '://' + rule.gitlab.url;
                    }
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
                            if(rule.from.test(dirname)){

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
                            dirname += dirpars[i] + options.request.combo.dir;
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
                
                if(matchedRule.gitlab){
                    reqPars.filenames.forEach(function(filename, i){
                        var metas = {
                            pars: {
                                far: filename,
                                reg: /^[^\/]+\/[^\/]+\/(\d+\.){2}\d+\//g,
                                val: '',
                                proj: {
                                    reg: /^[^\/]+\/[^\/]+/g,
                                    val: ''
                                },
                                vers: {
                                    reg: /(\d+\.){2}\d+/g,
                                    val: ''
                                }
                            }
                        };
                        
                        metas.pars.val = filename.match(metas.pars.reg);
                        
                        if(metas.pars.val){
                            metas.pars.val = metas.pars.val[0];
                            
                            metas.pars.proj.val = metas.pars.val.match(metas.pars.proj.reg)[0];
                            metas.pars.vers.val = metas.pars.val.match(metas.pars.vers.reg)[0];
                            
                            filename = matchedRule.to + filename.replace(metas.pars.val, '');
                            
                            promises.push(gitlab.file(matchedRule.gitlab, {
                                project : metas.pars.proj.val,
                                branch  : matchedRule.gitlab.tag.pre + 
                                          matchedRule.gitlab.tag.mid + 
                                          metas.pars.vers.val,
                                filename: filename
                            }));
                            
                        }else {
                            log(('Unmatched request').red + 
                                (': [' + reqPars.toString(filename) + ']').grey);
                        }
                    });
                }else {
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
                }
                
                
                
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
}(require('http'), require('util'), require('merge'), require('promise'), require('colors'),
  require('./nw'), require('./fs'), require('./gitlab'), require('./request'), require('./request.fopts'), 
  require('./response'), require('./response.fopts'), require('./try2do'), require('./log')));