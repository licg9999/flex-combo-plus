/**
#convention
:Rule
.name: String
.from: String|RegExp
.to  : String
/convention

**/
module.exports = (function(){
    
    var http    = require('http'),
        querystring = require('querystring'),
        
        path    = require('path'),
        fs      = require('fs'),
        
        
        merge   = require('merge');
        
    
    function log(l){
        /**
        l: String
        **/
        console.log(l);
    }
    
    
    
    
    return function(rules, options){
        /**
        rules  : Array<Rule>
        options: Object
        @return: function(req, res, nex){
            req: http.IncomingMessage
            res: http.ClientRequest
            nex: function(){}
        }
        **/
        
        /** 格式化参数 **/
        (function(){
            if(!rules){
                rules = [];
            }
            if(!options){
                options = {};
            }
            
            /** configurable **/
            options = merge.recursive({
                combo: {
                    start   : '??',
                    seq     : ','
                },
                query: {
                    start   : '?',
                    seq     : '&',
                    ass     : '='
                }
            }, options);
            
            /** unconfigurable **/
            merge.recursive(options, {
                host : {
                    seq     : ':'
                },
                combo: {
                    dir     : '/'
                }
            })
        }());
        
        
        
        return function(req, res, nex){
            
            function try2do(fn){
                /**
                fn: function(){}
                **/
                if(fn){
                    try{ fn(); }catch(e){
                        res.end();
                    }
                }else{
                    res.end();
                }
            }
            
            function next(){
                try2do(nex);
            }
            
            var source = (function(){
                
                var hostParts = req.headers.host.split(options.host.seq),
                    urlPath = req.url;
                
                var lenC = options.combo.start.length,
                    posC = urlPath.indexOf(options.combo.start),
                    hasC = posC >= 0;

                if(!hasC){
                    posC -= lenC - 1; 
                }

                var lenQ = options.query.start.length,
                    posQ = urlPath.substr(posC + lenC, urlPath.length).indexOf(options.query.start),
                    hasQ = posQ >= 0;
                
                posQ += posC + lenC;
                if(!hasQ){
                    posQ -= lenQ - 1;
                }
                
                
                var out = {};
                
                out.hostname = hostParts[0];
                
                out.port = hostParts[1];
                
                out.dirname = (function(){
                    if(hasC){

                        return urlPath.substring(0, posC);
                    }else{
                        
                        var pathname;
                        if(hasQ){
                            
                            pathname = urlPath.substring(0, posQ);
                        }else{
                            
                            pathname = urlPath.substring(0, urlPath.length);
                        }
                        
                        return pathname.substring(0, pathname.lastIndexOf(options.combo.dir) + 1);
                    }
                }());
                
                out.filenames = (function(){
                    var posS = urlPath.indexOf(out.dirname) + out.dirname.length,
                        posE = urlPath.length;
                    
                    if(hasC){
                        posS += lenC;
                    }
                    
                    if(hasQ){
                        posE = posQ;
                    }
                    
                    var filenames = urlPath.substring(posS, posE);
                    
                    if(hasC){
                        
                        filenames = filenames.split(options.combo.seq);
                    }else{
                        
                        filenames = [filenames];
                    }
                    
                    return filenames;
                }());
                
                out.query = (function(){
                    if(hasQ){
                        
                        return querystring.parse(urlPath.substr(posQ + lenQ, urlPath.length), 
                                                 options.query.seq, options.query.ass);
                    }else{
                        
                        return {};
                    }
                }());
                
                return out;
            }());
            
            
            
            next();
        };
    };
}());