/**
#convention
:Rule
.name: String
.from: String|RegExp
.to  : String
/convention

**/
module.exports = (function(){
    var url     = require('url'),
        http    = require('http'),
        
        path    = require('path'),
        fs      = require('fs'),
        
        crypto  = require('crypto'),
        dac     = require('dac'),
        isUtf8  = require('is-utf8'),
        iconv   = require('iconv-lite'),
        joinbuffers = require('joinbuffers'),
        util    = require('util'),
        mime    = require('mime'),
        mkdirp  = require('mkdirp'),
        readyconf = require('readyconf');
    
    function log(l){
        /**
        l: String
        **/
        console.log(l);
    }
    
    function try2do(fn){
        try{ fn(); }catch(e){ }
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
        
        
        return function(req, res){
            
            function error(){
                try2do(function(){
                    options.error(req, res);
                });
            }

            function next(){
                try2do(function(){
                    options.next(req, res);
                });
            }

            function prev(){
                try2do(function(){
                    options.prev(req, res);
                });
            }
            
            var source = {
                _host: function(){
                    return req.headers.host;
                },
                
                hostname: function(){
                    /**
                    @return: String
                    **/
                    return this._host().split(':')[0];
                },
                
                port: function(){
                    /**
                    @return: String
                    **/
                    return this._host().split(':')[1];
                },
                
                _url: function(){
                    return url.parse(req.url);
                },
                
                pathname: function(){
                    /**
                    @return: String
                    **/
                    return this._url().pathname;
                },
                
                search: function(){
                    /**
                    @return: String
                    **/
                    return this._url().search;
                }
            };
            
            prev();
            
            console.log(source.pathname());
            
            next();
        };
    };
}());